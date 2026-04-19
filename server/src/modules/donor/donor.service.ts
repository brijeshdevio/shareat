import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DonorService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(donorId: string) {
    return await this.prisma.donorProfile.findUnique({
      where: { userId: donorId },
      omit: {
        userId: true,
      },
    });
  }
}
