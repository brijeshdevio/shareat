import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaService } from '../prisma/prisma.service';
import { PRISMA_CODES } from '../constants';
import { DonorProfileDto } from './donor.schema';

@Injectable()
export class DonorService {
  constructor(private readonly prismaService: PrismaService) {}

  async getProfile(userId: string) {
    try {
      const profile = await this.prismaService.donorProfile.findFirst({
        where: { userId },
        omit: {
          userId: true,
        },
      });

      if (!profile) {
        return await this.prismaService.donorProfile.create({
          data: {
            userId,
          },
          select: {
            id: true,
          },
        });
      }

      return profile;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PRISMA_CODES.NOT_FOUND
      ) {
        throw new UnauthorizedException();
      }

      throw new InternalServerErrorException();
    }
  }

  async updateProfile(userId: string, data: DonorProfileDto) {
    try {
      await this.prismaService.donorProfile.update({
        where: { userId },
        data: {
          ...data,
        },
      });
      return data;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PRISMA_CODES.NOT_FOUND
      ) {
        throw new UnauthorizedException();
      }

      throw new InternalServerErrorException();
    }
  }
}
