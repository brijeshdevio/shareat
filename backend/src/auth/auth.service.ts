import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from '../lib/argon';
import { DUMMY_HASH, PRISMA_CODES } from '../constants';
import { LoginDto, RegisterDto } from './auth.schema';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private async accessToken(payload: Record<string, unknown>): Promise<string> {
    return await this.jwtService.signAsync({
      ...payload,
      type: 'access',
    });
  }

  async register(data: RegisterDto): Promise<any> {
    try {
      const hashedPassword = await hashPassword(data.password);
      return await this.prismaService.user.create({
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

  async login(data: LoginDto): Promise<string> {
    const user = await this.prismaService.user.findUnique({
      where: { email: data.email },
    });

    const passwordToCheck: string = user?.passwordHash ?? DUMMY_HASH;
    const isPasswordValid = await verifyPassword(
      passwordToCheck,
      data.password,
    );

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.accessToken({
      id: user.id,
      role: user.role,
    });
    return accessToken;
  }
}
