import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PRISMA_CODES } from 'src/constants';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  CreateDonationDto,
  DonorUpdateProfileDto,
  GetDonationsQueryDto,
  UpdateDonationDto,
} from './donor.types';

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

  async getDonations(donorId: string, queries: GetDonationsQueryDto) {
    const where: Record<string, unknown> = { donorId };
    if (queries.status) {
      where.status = queries.status;
    }
    if (queries.category) {
      where.category = queries.category;
    }

    const skip = queries.page ? (queries.page - 1) * queries.limit : 0;
    const take = queries.limit ? queries.limit : 10;
    const donations = await this.prisma.donation.findMany({
      where,
      skip,
      take,
      orderBy: {
        [queries.sortBy]: queries.order,
      },
    });
    const total = await this.prisma.donation.count({ where, skip, take });
    const totalPages = Math.ceil(total / queries.limit);

    return {
      donations,
      meta: {
        total,
        totalPages,
        page: queries.page,
        limit: queries.limit,
      },
    };
  }

  async getDonationById(donorId: string, donationId: string) {
    const donation = await this.prisma.donation.findUnique({
      where: { donorId, id: donationId },
    });
    if (!donation) throw new NotFoundException();
    return donation;
  }

  async updateDonation(
    donorId: string,
    donationId: string,
    payload: UpdateDonationDto,
  ) {
    const donation = await this.prisma.donation.findFirst({
      where: { id: donationId, donorId },
      include: { items: true },
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    if (!['DRAFT', 'PENDING'].includes(donation.status)) {
      throw new BadRequestException(
        'Only DRAFT or PENDING donations can be updated',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedDonation = await tx.donation.update({
        where: { id: donationId },
        data: {
          ...(payload.title && { title: payload.title }),
          ...(payload.description && { description: payload.description }),
          ...(payload.category && { category: payload.category }),
          ...(payload.pickupAddress && {
            pickupAddress: payload.pickupAddress,
          }),
          ...(payload.pickupCity && { pickupCity: payload.pickupCity }),
          ...(payload.pickupPincode && {
            pickupPincode: payload.pickupPincode,
          }),
          ...(payload.photos && { photos: payload.photos }),
        },
      });

      // 2. Items handling (replace strategy)
      if (payload.items) {
        await tx.donationItem.deleteMany({
          where: { donationId },
        });

        await tx.donationItem.createMany({
          data: payload.items.map((item) => ({
            donationId,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            condition: item.condition,
          })),
        });
      }

      return updatedDonation;
    });
  }

  async publishDonation(donorId: string, donationId: string) {
    const donation = await this.prisma.donation.findFirst({
      where: { id: donationId, donorId },
      include: { items: true },
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    // strict state machine
    if (donation.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT donations can be published');
    }

    // completeness validation
    if (
      !donation.title ||
      !donation.description ||
      !donation.category ||
      !donation.pickupAddress ||
      !donation.pickupCity ||
      !donation.pickupPincode
    ) {
      throw new BadRequestException(
        'Donation is incomplete. Fill all required fields before publishing',
      );
    }

    if (!donation.items || donation.items.length === 0) {
      throw new BadRequestException(
        'At least one item is required before publishing',
      );
    }

    return this.prisma.donation.update({
      where: { id: donationId },
      data: {
        status: 'PENDING',
      },
      select: { id: true, status: true },
    });
  }
}
