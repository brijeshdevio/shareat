import crypto from 'node:crypto';

import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { DUMMY_HASH, PRISMA_CODES } from 'src/constants';
import { passwordHash, passwordVerify } from 'src/lib/argon';
import { PrismaService } from 'src/prisma/prisma.service';

import { LoginDto, RegisterDto } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private async accessToken(payload: Record<string, unknown>): Promise<string> {
    return await this.jwt.signAsync({
      ...payload,
      type: 'access',
    });
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateTokens(
    userId: string,
    role: string,
    existingExpiry?: Date,
  ) {
    const accessToken = await this.accessToken({
      sub: userId,
      role: role,
    });

    const rawRefresh = crypto.randomBytes(64).toString('hex');
    const hashedRefresh = this.hashToken(rawRefresh);

    const expiresAt =
      existingExpiry ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        token: hashedRefresh,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: rawRefresh, expiresAt };
  }

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

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    const passwordToCheck = user?.passwordHash ?? DUMMY_HASH;
    const isPasswordValid = await passwordVerify(
      passwordToCheck,
      data.password,
    );
    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return await this.generateTokens(user?.id, user?.role);
  }
}
