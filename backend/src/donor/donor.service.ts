import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaService } from '../prisma/prisma.service';
import { PRISMA_CODES } from '../constants';
import {
  CreateDonationDto,
  DonorProfileDto,
  UpdateDonationDto,
} from './donor.schema';

@Injectable()
export class DonorService {
  constructor(private readonly prismaService: PrismaService) {}

  async getProfile(userId: string) {
    try {
      const profile = await this.prismaService.donorProfile.findFirst({
        where: { userId },
        omit: {
          userId: true,
        },
      });

      if (!profile) {
        return await this.prismaService.donorProfile.create({
          data: {
            userId,
          },
          select: {
            id: true,
          },
        });
      }

      return profile;
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

  async updateProfile(userId: string, data: DonorProfileDto) {
    try {
      await this.prismaService.donorProfile.update({
        where: { userId },
        data: {
          ...data,
        },
      });
      return data;
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

  async createDonation(donorId: string, data: CreateDonationDto) {
    try {
      return await this.prismaService.donation.create({
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

  async getDonations(donorId: string) {
    return await this.prismaService.donation.findMany({
      where: { donorId },
      select: {
        id: true,
        title: true,
        category: true,
        pickupPincode: true,
        createdAt: true,
      },
    });
  }

  async getDonation(donorId: string, donationId: string) {
    const donation = await this.prismaService.donation.findFirst({
      where: { id: donationId, donorId },
      omit: {
        donorId: true,
      },
    });
    if (!donation) {
      throw new NotFoundException();
    }

    return donation;
  }

  async updateDonation(
    donorId: string,
    donationId: string,
    data: UpdateDonationDto,
  ) {
    try {
      const { updatedAt } = await this.prismaService.donation.update({
        where: { id: donationId, donorId },
        data: {
          pickupAddress: data?.pickupAddress,
          pickupCity: data?.pickupCity,
          title: data?.title,
          description: data?.description,
          category: data?.category,
          pickupState: data?.pickupState,
          pickupPincode: data?.pickupPincode,
          pickupLat: data?.pickupLat,
          pickupLng: data?.pickupLng,
          photos: data?.photos,
        },
        select: {
          updatedAt: true,
        },
      });

      return { ...data, updatedAt };
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

  async publishDonation(donorId: string, donationId: string) {
    try {
      await this.prismaService.donation.update({
        where: { id: donationId, donorId },
        data: {
          status: 'PENDING',
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PRISMA_CODES.NOT_FOUND
      ) {
        throw new NotFoundException();
      }

      throw new InternalServerErrorException();
    }
  }

  async cancelDonation(donorId: string, donationId: string) {
    try {
      await this.prismaService.donation.update({
        where: { id: donationId, donorId },
        data: {
          status: 'CANCELLED',
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PRISMA_CODES.NOT_FOUND
      ) {
        throw new NotFoundException();
      }

      throw new InternalServerErrorException();
    }
  }

  async deleteDonation(donorId: string, donationId: string) {
    try {
      await this.prismaService.donation.delete({
        where: { id: donationId, donorId },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PRISMA_CODES.NOT_FOUND
      ) {
        throw new NotFoundException();
      }

      throw new InternalServerErrorException();
    }
  }
}
