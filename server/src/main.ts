import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { env } from './config/env.config';

const PORT = env.PORT;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT);
}
bootstrap()
  .then(() => {
    console.log(`Server is running on http://localhost:${PORT}`);
  })
  .catch(console.error);
