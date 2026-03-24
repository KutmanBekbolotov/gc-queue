import { Inject, Injectable } from '@nestjs/common';
import { BinaryLike, createHash, randomBytes, scrypt } from 'crypto';
import { OPERATOR_AUTH_OPTIONS } from './operator-auth.constants';
import { ResolvedOperatorAuthModuleOptions } from './operator-auth.interfaces';
import { safeCompare } from './operator-auth.utils';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;
@Injectable()
export class OperatorPasswordHashService {
  constructor(
    @Inject(OPERATOR_AUTH_OPTIONS)
    private readonly options: ResolvedOperatorAuthModuleOptions,
  ) {}

  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('base64url');
    const derivedKey = await this.scrypt(
      this.withPepper(password),
      salt,
      SCRYPT_KEY_LENGTH,
      {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
      },
    );

    return [
      'scrypt',
      SCRYPT_N.toString(),
      SCRYPT_R.toString(),
      SCRYPT_P.toString(),
      salt,
      derivedKey.toString('base64url'),
    ].join('$');
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const [algorithm, n, r, p, salt, storedHash] = hash.split('$');
    if (
      algorithm !== 'scrypt' ||
      !n ||
      !r ||
      !p ||
      !salt ||
      !storedHash
    ) {
      return false;
    }

    const derivedKey = await this.scrypt(
      this.withPepper(password),
      salt,
      SCRYPT_KEY_LENGTH,
      {
        N: Number(n),
        r: Number(r),
        p: Number(p),
      },
    );

    return safeCompare(derivedKey.toString('base64url'), storedHash);
  }

  hashToken(token: string): string {
    return createHash('sha256')
      .update(this.withPepper(token))
      .digest('base64url');
  }

  private withPepper(value: string): string {
    if (!this.options.passwordPepper) {
      return value;
    }

    return `${this.options.passwordPepper}:${value}`;
  }

  private async scrypt(
    password: BinaryLike,
    salt: BinaryLike,
    keyLength: number,
    options: {
      N: number;
      r: number;
      p: number;
    },
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, keyLength, options, (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey as Buffer);
      });
    });
  }
}
