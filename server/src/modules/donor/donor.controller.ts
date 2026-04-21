import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { ZodValidationPipe } from 'src/common/pipes/zod-validate.pipe';
import { sendSuccess } from 'src/utils/response';

import {
  CreateCollectionRequestSchema,
  CreateDonationSchema,
  DonorUpdateProfileSchema,
  GetDonationsQuerySchema,
  UpdateDonationSchema,
} from './donor.schema';
import { DonorService } from './donor.service';
import {
  type CreateCollectionRequestDto,
  type CreateDonationDto,
  type DonorUpdateProfileDto,
  type GetDonationsQueryDto,
  type UpdateDonationDto,
} from './donor.types';

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

  @Post('donations')
  @HttpCode(201)
  async createDonation(
    @CurrentUser('id') donorId: string,
    @Body(new ZodValidationPipe(CreateDonationSchema))
    data: CreateDonationDto,
  ) {
    const donation = await this.donorService.createDonation(donorId, data);
    return sendSuccess({
      statusCode: 201,
      message: 'Donation created successfully',
      data: donation,
    });
  }

  @Get('donations')
  async getDonations(
    @CurrentUser('id') donorId: string,
    @Query(new ZodValidationPipe(GetDonationsQuerySchema))
    queries: GetDonationsQueryDto,
  ) {
    const { donations, meta } = await this.donorService.getDonations(
      donorId,
      queries,
    );

    return sendSuccess({
      data: donations,
      meta,
    });
  }

  @Get('donations/:donationId')
  async getDonationById(
    @CurrentUser('id') donorId: string,
    @Param('donationId') donationId: string,
  ) {
    const donation = await this.donorService.getDonationById(
      donorId,
      donationId,
    );
    return sendSuccess({ data: donation });
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
    const donation = await this.donorService.publishDonation(
      donorId,
      donationId,
    );

    return sendSuccess({
      message: 'Donation published successfully',
      data: donation,
    });
  }

  async cancelDonation(
    @CurrentUser('id') donorId: string,
    @Param('donationId') donationId: string,
  ) {
    const donation = await this.donorService.cancelDonation(
      donorId,
      donationId,
    );

    return sendSuccess({
      message: 'Donation cancelled successfully',
      data: donation,
    });
  }

  @Post('donations/:donationId/requests')
  async createCollectionRequest(
    @CurrentUser('id') donorId: string,
    @Param('donationId') donationId: string,
    @Body(new ZodValidationPipe(CreateCollectionRequestSchema))
    body: CreateCollectionRequestDto,
  ) {
    const request = await this.donorService.createCollectionRequest(
      donorId,
      donationId,
      body,
    );

    return sendSuccess({
      message: 'Collection request created successfully',
      data: request,
    });
  }
}
