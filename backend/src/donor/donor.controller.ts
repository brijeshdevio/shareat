import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { DonorService } from './donor.service';
import { CurrentUser } from '../common/decorators/currentUser.decorator';
import { ZodValidationPipe } from '../common/pipes/zodValidation.pipe';
import { RoleGuard } from '../common/guards/role.guard';
import { AuthGuard } from '../common/guards/auth.guard';
import { sendSuccess } from '../utils/response';
import { type DonorProfileDto, DonorProfileSchema } from './donor.schema';

@Controller('donor')
@UseGuards(new RoleGuard(['DONOR']))
@UseGuards(AuthGuard)
export class DonorController {
  constructor(private readonly donorService: DonorService) {}

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    const profile = await this.donorService.getProfile(userId);
    return sendSuccess({
      data: profile,
    });
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(DonorProfileSchema))
    body: DonorProfileDto,
  ) {
    const profile = await this.donorService.updateProfile(userId, body);
    return sendSuccess({
      message: 'Profile updated successfully',
      data: profile,
    });
  }
}
