import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DonorService } from './donor.service';
import { CurrentUser } from '../common/decorators/currentUser.decorator';
import { ZodValidationPipe } from '../common/pipes/zodValidation.pipe';
import { RoleGuard } from '../common/guards/role.guard';
import { AuthGuard } from '../common/guards/auth.guard';
import { sendSuccess } from '../utils/response';
import {
  type CreateDonationDto,
  CreateDonationSchema,
  type DonorProfileDto,
  DonorProfileSchema,
} from './donor.schema';

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

  @Post('donations')
  async createDonation(
    @CurrentUser('id') donorId: string,
    @Body(new ZodValidationPipe(CreateDonationSchema))
    body: CreateDonationDto,
  ) {
    const donation = await this.donorService.createDonation(donorId, body);
    return sendSuccess({
      message: 'Donation created successfully',
      data: donation,
    });
  }

  @Get('donations')
  async getDonations(@CurrentUser('id') donorId: string) {
    const donations = await this.donorService.getDonations(donorId);
    return sendSuccess({
      data: { donations },
    });
  }

  @Get('donations/:donationId')
  async getDonation(
    @CurrentUser('id') donorId: string,
    @Param('donationId') donationId: string,
  ) {
    const donation = await this.donorService.getDonation(donorId, donationId);
    return sendSuccess({
      data: donation,
    });
  }
}
