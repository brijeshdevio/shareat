import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  type UpdateDonationDto,
  UpdateDonationSchema,
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
  @HttpCode(HttpStatus.CREATED)
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

  @Patch('donations/:donationId')
  async updateDonation(
    @CurrentUser('id') donorId: string,
    @Param('donationId') donationId: string,
    @Body(new ZodValidationPipe(UpdateDonationSchema))
    body: UpdateDonationDto,
  ) {
    const donation = await this.donorService.updateDonation(
      donorId,
      donationId,
      body,
    );
    return sendSuccess({
      message: 'Donation updated successfully',
      data: donation,
    });
  }

  @Patch('donations/:donationId/publish')
  async publishDonation(
    @CurrentUser('id') donorId: string,
    @Param('donationId') donationId: string,
  ) {
    await this.donorService.publishDonation(donorId, donationId);
    return sendSuccess({
      message: 'Donation published successfully',
    });
  }

  @Patch('donations/:donationId/cancel')
  async cancelDonation(
    @CurrentUser('id') donorId: string,
    @Param('donationId') donationId: string,
  ) {
    await this.donorService.cancelDonation(donorId, donationId);
    return sendSuccess({
      message: 'Donation cancelled successfully',
    });
  }

  @Delete('donations/:donationId')
  async deleteDonation(
    @CurrentUser('id') donorId: string,
    @Param('donationId') donationId: string,
  ) {
    await this.donorService.deleteDonation(donorId, donationId);
    return sendSuccess({
      message: 'Donation deleted successfully',
    });
  }
}
