import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

import { DonorController } from './donor.controller';
import { DonorService } from './donor.service';

@Module({
  imports: [PrismaModule],
  controllers: [DonorController],
  providers: [DonorService],
})
export class DonorModule {}
