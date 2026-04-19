import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { DonorModule } from './modules/donor/donor.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, DonorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
