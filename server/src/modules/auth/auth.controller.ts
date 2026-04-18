import { Body, Controller, HttpCode, Post, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'src/common/pipes/zod-validate.pipe';
import { sendSuccess } from 'src/utils/response';

import { RegisterSchema } from './auth.schema';
import { AuthService } from './auth.service';
import { type RegisterDto } from './auth.types';

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
}
