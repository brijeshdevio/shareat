import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginSchema,
  RegisterSchema,
  type LoginDto,
  type RegisterDto,
} from './auth.schema';
import { sendSuccess } from '../utils/response';
import { ZodValidationPipe } from '../common/pipes/zodValidation.pipe';
import { AuthGuard } from '../common/guards/auth.guard';
import { clearCookie, setCookie } from '../utils/cookie';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterDto): Promise<any> {
    const user = await this.authService.register(body);
    return sendSuccess({
      status: 201,
      message: 'User registered successfully',
      data: user,
    });
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto, @Res() res: Response): Promise<Response> {
    const accessToken = await this.authService.login(body);
    setCookie(res, 'accessToken', accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
    });
    return res
      .status(200)
      .json({ success: true, message: 'Login successful', data: null });
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res() res: Response): Response {
    clearCookie(res, 'accessToken');
    return res
      .status(200)
      .json({ success: true, message: 'Logout successful', data: null });
  }
}
