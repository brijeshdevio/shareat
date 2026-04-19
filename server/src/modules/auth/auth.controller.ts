import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { ZodValidationPipe } from 'src/common/pipes/zod-validate.pipe';
import { ACCESS_COOKIE, REFRESH_COOKIE } from 'src/constants';
import { clearCookie, setCookie } from 'src/utils/cookie';
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

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = req.cookies?.[REFRESH_COOKIE] as string;
    if (!rawToken) throw new UnauthorizedException('No refresh token');

    const { accessToken, refreshToken, expiresAt } =
      await this.authService.refresh(rawToken);

    const remainingMs = expiresAt.getTime() - Date.now();

    setCookie(res, ACCESS_COOKIE, accessToken, {
      maxAge: 15 * 60 * 1000,
    });
    setCookie(res, REFRESH_COOKIE, refreshToken, {
      maxAge: remainingMs,
    });

    return sendSuccess({ message: 'Rotated refresh token' });
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.[REFRESH_COOKIE] as string;
    if (!rawToken) throw new UnauthorizedException('No refresh token');

    await this.authService.logout(rawToken);

    clearCookie(res, REFRESH_COOKIE);
    clearCookie(res, ACCESS_COOKIE);
  }
}
