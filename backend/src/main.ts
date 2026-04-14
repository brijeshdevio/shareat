import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(env.PORT);
}
bootstrap()
  .then(() => {
    console.log(`Server running on port ${process.env.PORT ?? 3000}`);
  })
  .catch(console.error);
