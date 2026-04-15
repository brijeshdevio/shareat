import { Controller, Delete, Get, Res, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/currentUser.decorator';
import { sendSuccess } from '../utils/response';
import { clearCookie } from '../utils/cookie';
import type { Response } from 'express';

@Controller('users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    const profile = await this.userService.getProfile(userId);
    return sendSuccess({
      data: profile,
    });
  }

  @Delete('account')
  async deleteAccount(@CurrentUser('id') userId: string, @Res() res: Response) {
    await this.userService.deleteAccount(userId);
    clearCookie(res, 'accessToken');
    return res.status(200).json({
      success: true,
      message:
        'Account deactivated successfully. After 7 days, your account will be permanently deleted.',
      data: null,
    });
  }
}
