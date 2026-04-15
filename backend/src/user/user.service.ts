import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaService } from '../prisma/prisma.service';
import { PRISMA_CODES } from '../constants';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prismaService.user.findFirst({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    if (!profile) {
      throw new UnauthorizedException();
    }

    return profile;
  }

  async deleteAccount(userId: string) {
    try {
      await this.prismaService.user.update({
        where: { id: userId, isActive: true },
        data: { isActive: false },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PRISMA_CODES.NOT_FOUND
      ) {
        throw new UnauthorizedException();
      }
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
