import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PRISMA_CODES } from 'src/constants';
import { passwordHash } from 'src/lib/argon';
import { PrismaService } from 'src/prisma/prisma.service';

import { RegisterDto } from './auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(data: RegisterDto) {
    try {
      const hashedPassword = await passwordHash(data.password);
      return await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: hashedPassword,
          role: data.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PRISMA_CODES.CONFLICT
      ) {
        throw new ConflictException(
          `User with email ${data.email} already exists`,
        );
      }
      throw new InternalServerErrorException();
    }
  }
}
