import {
  Body,
  Controller,
  HttpCode,
  Post,
  Res,
  UsePipes,
} from '@nestjs/common';
import { type Response } from 'express';
import { ZodValidationPipe } from 'src/common/pipes/zod-validate.pipe';
import { ACCESS_COOKIE, REFRESH_COOKIE } from 'src/constants';
import { setCookie } from 'src/utils/cookie';
import { sendSuccess } from 'src/utils/response';

import { LoginSchema, RegisterSchema } from './auth.schema';
import { AuthService } from './auth.service';
import { type LoginDto, type RegisterDto } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  @HttpCode(201)
  async register(@Body() body: RegisterDto) {
    const user = await this.authService.register(body);
    return sendSuccess({
      statusCode: 201,
      message: 'User registered successfully',
      data: user,
    });
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(data);
    setCookie(res, ACCESS_COOKIE, accessToken, {
      maxAge: 15 * 60 * 1000,
    });
    setCookie(res, REFRESH_COOKIE, refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess({
      message: 'User logged in successfully',
    });
  }
}
