import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { ZodValidationPipe } from 'src/common/pipes/zod-validate.pipe';
import { sendSuccess } from 'src/utils/response';

import { DonorUpdateProfileSchema } from './donor.schema';
import { DonorService } from './donor.service';
import { type DonorUpdateProfileDto } from './donor.types';

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

  @Patch('profile')
  async updateProfile(
    @CurrentUser('id') donorId: string,
    @Body(new ZodValidationPipe(DonorUpdateProfileSchema))
    data: DonorUpdateProfileDto,
  ) {
    const donor = await this.donorService.updateProfile(donorId, data);
    return sendSuccess({
      message: 'Donor profile updated successfully',
      data: donor,
    });
  }
}
