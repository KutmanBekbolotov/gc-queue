import { ValidationPipe } from '@nestjs/common';
import { INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuditModule } from '../src/audit/audit.module';
import { OperatorAuthModule } from '../src/operator-auth/operator-auth.module';

@Module({
  imports: [
    AuditModule,
    OperatorAuthModule.register({
      accessTokenSecret:
        'operator-auth-test-access-secret-minimum-length-1234567890',
      refreshTokenSecret:
        'operator-auth-test-refresh-secret-minimum-length-123456789',
      accessTokenTtl: '15m',
      refreshTokenTtl: '7d',
      audience: 'operator-ui',
      issuer: 'gc-queue-nest-tests',
      allowedRoleCodes: ['OPERATOR'],
      passwordPepper: 'operator-auth-test-pepper',
      seedUsers: [
        {
          username: 'operator',
          password: 'StrongPassword_123!',
          fullName: 'Operator Test User',
          roles: ['OPERATOR'],
        },
        {
          username: 'analyst',
          password: 'StrongPassword_123!',
          fullName: 'Analyst Test User',
          roles: ['ANALYST'],
        },
      ],
    }),
  ],
})
class OperatorAuthTestModule {}

describe('OperatorAuthModule (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OperatorAuthTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('logs in an operator and returns the current profile', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/operator-auth/login')
      .send({
        login: 'operator',
        password: 'StrongPassword_123!',
        deviceFingerprint: 'device-a',
      })
      .expect(200);

    expect(loginResponse.body.user).toEqual(
      expect.objectContaining({
        username: 'operator',
        fullName: 'Operator Test User',
        roles: ['OPERATOR'],
      }),
    );
    expect(typeof loginResponse.body.tokens.accessToken).toBe('string');
    expect(typeof loginResponse.body.tokens.refreshToken).toBe('string');

    const meResponse = await request(app.getHttpServer())
      .get('/operator-auth/me')
      .set(
        'Authorization',
        `Bearer ${loginResponse.body.tokens.accessToken as string}`,
      )
      .expect(200);

    expect(meResponse.body).toEqual(
      expect.objectContaining({
        username: 'operator',
        fullName: 'Operator Test User',
        roles: ['OPERATOR'],
        sessionId: loginResponse.body.user.sessionId,
      }),
    );
  });

  it('rotates refresh tokens and rejects replay of the previous token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/operator-auth/login')
      .send({
        login: 'operator',
        password: 'StrongPassword_123!',
        deviceFingerprint: 'device-a',
      })
      .expect(200);

    const firstRefreshToken = loginResponse.body.tokens.refreshToken as string;

    const refreshResponse = await request(app.getHttpServer())
      .post('/operator-auth/refresh')
      .send({
        refreshToken: firstRefreshToken,
        deviceFingerprint: 'device-a',
      })
      .expect(200);

    expect(refreshResponse.body.tokens.refreshToken).not.toBe(
      firstRefreshToken,
    );

    await request(app.getHttpServer())
      .post('/operator-auth/refresh')
      .send({
        refreshToken: firstRefreshToken,
        deviceFingerprint: 'device-a',
      })
      .expect(401);
  });

  it('rejects users outside the allowed operator roles', async () => {
    await request(app.getHttpServer())
      .post('/operator-auth/login')
      .send({
        login: 'analyst',
        password: 'StrongPassword_123!',
      })
      .expect(401);
  });
});
