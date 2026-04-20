import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PRISMA_CODES } from 'src/constants';
import { PrismaService } from 'src/prisma/prisma.service';

import { CreateDonationDto, DonorUpdateProfileDto } from './donor.types';

@Injectable()
export class DonorService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(donorId: string) {
    return await this.prisma.donorProfile.findUnique({
      where: { userId: donorId },
      omit: {
        userId: true,
      },
    });
  }

  async updateProfile(donorId: string, data: DonorUpdateProfileDto) {
    try {
      return await this.prisma.donorProfile.update({
        where: { userId: donorId },
        data: { ...data },
        omit: {
          userId: true,
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PRISMA_CODES.NOT_FOUND
      ) {
        throw new NotFoundException('Donor not found');
      }
      throw new InternalServerErrorException();
    }
  }

  async createDonation(donorId: string, data: CreateDonationDto) {
    try {
      return await this.prisma.donation.create({
        data: {
          pickupAddress: data.pickupAddress,
          pickupCity: data.pickupCity,
          title: data.title,
          description: data.description,
          category: data.category,
          pickupState: data.pickupState,
          pickupPincode: data.pickupPincode,
          pickupLat: data.pickupLat,
          pickupLng: data.pickupLng,
          photos: data.photos,
          items: { createMany: { data: data.items } },
          donorId,
        },
        select: {
          id: true,
          title: true,
          category: true,
          pickupPincode: true,
          createdAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PRISMA_CODES.NOT_FOUND
      ) {
        throw new UnauthorizedException();
      }

      throw new InternalServerErrorException();
    }
  }
}
