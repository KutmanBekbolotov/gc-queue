import { writeFileSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { createOpenApiDocument } from '../src/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = createOpenApiDocument(app);

  writeFileSync('openapi.json', JSON.stringify(document, null, 2));
  await app.close();
}

void bootstrap();
