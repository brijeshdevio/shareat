import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { sendSuccess } from 'src/utils/response';

import { DonorService } from './donor.service';

@Controller('donor')
@UseGuards(new RoleGuard(['DONOR']))
@UseGuards(AuthGuard)
export class DonorController {
  constructor(private readonly donorService: DonorService) {}

  @Get('profile')
  async getProfile(@CurrentUser('id') donorId: string) {
    const donor = await this.donorService.getProfile(donorId);
    return sendSuccess({ data: donor });
  }
}
