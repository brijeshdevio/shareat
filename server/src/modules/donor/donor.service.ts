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
  CreateCollectionRequestDto,
  CreateDonationDto,
  DonorUpdateProfileDto,
  GetDonationsQueryDto,
  GetNGOsQueryDto,
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

  async cancelDonation(donorId: string, donationId: string) {
    const donation = await this.prisma.donation.findFirst({
      where: { id: donationId, donorId },
      include: {
        collectionRequests: true,
      },
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    if (!['PENDING', 'SCHEDULED'].includes(donation.status)) {
      throw new BadRequestException(
        'Only PENDING or SCHEDULED donations can be cancelled',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Cancel donation
      const updatedDonation = await tx.donation.update({
        where: { id: donationId },
        data: {
          status: 'CANCELLED',
        },
      });

      // 2. Cascade cancel collection requests
      await tx.collectionRequest.updateMany({
        where: {
          donationId,
          status: {
            in: ['REQUESTED', 'ACCEPTED'],
          },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      return updatedDonation;
    });
  }

  async createCollectionRequest(
    donorId: string,
    donationId: string,
    payload: CreateCollectionRequestDto,
  ) {
    const donation = await this.prisma.donation.findFirst({
      where: { id: donationId, donorId },
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    if (donation.status !== 'PENDING') {
      throw new BadRequestException(
        'Collection request can only be created for PENDING donations',
      );
    }

    const existingRequest = await this.prisma.collectionRequest.findFirst({
      where: {
        donationId,
        status: {
          in: ['REQUESTED', 'ACCEPTED'],
        },
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'An active collection request already exists for this donation',
      );
    }

    // validate NGO
    const ngo = await this.prisma.nGOProfile.findUnique({
      where: { id: payload.ngoProfileId },
    });

    if (!ngo) {
      throw new NotFoundException('NGO not found');
    }

    if (ngo.verificationStatus !== 'APPROVED') {
      throw new BadRequestException('NGO is not verified');
    }

    if (!ngo.acceptedCategories.includes(donation.category)) {
      throw new BadRequestException('NGO does not accept this category');
    }

    // date validation (no past scheduling)
    if (payload.scheduledDate < new Date()) {
      throw new BadRequestException('Scheduled date cannot be in the past');
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.collectionRequest.create({
        data: {
          donationId,
          ngoId: ngo.userId,
          ngoProfileId: ngo.id,
          scheduledDate: payload.scheduledDate,
          timeSlot: payload.timeSlot,
          notes: payload.notes,
        },
      });

      // optional: update donation → SCHEDULED
      await tx.donation.update({
        where: { id: donationId },
        data: {
          status: 'SCHEDULED',
        },
      });

      return request;
    });
  }

  async getCollectionRequests(donorId: string, donationId: string) {
    const donation = await this.prisma.donation.findFirst({
      where: { id: donationId, donorId },
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    const requests = await this.prisma.collectionRequest.findMany({
      where: { donationId },
      orderBy: { createdAt: 'desc' },
      include: {
        ngoProfile: {
          select: {
            id: true,
            orgName: true,
            city: true,
            state: true,
            rating: true,
          },
        },
      },
    });

    return requests;
  }

  async acceptCollectionRequest(
    donorId: string,
    donationId: string,
    requestId: string,
  ) {
    const donation = await this.prisma.donation.findFirst({
      where: { id: donationId, donorId },
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    if (donation.status !== 'PENDING') {
      throw new BadRequestException(
        'Only PENDING donations can accept a request',
      );
    }

    const request = await this.prisma.collectionRequest.findFirst({
      where: {
        id: requestId,
        donationId,
      },
    });

    if (!request) {
      throw new NotFoundException('Collection request not found');
    }

    if (request.status !== 'REQUESTED') {
      throw new BadRequestException('Only REQUESTED requests can be accepted');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Accept selected request
      const acceptedRequest = await tx.collectionRequest.update({
        where: { id: requestId },
        data: {
          status: 'ACCEPTED',
          confirmedAt: new Date(),
        },
      });

      // 2. Cancel all other active requests
      await tx.collectionRequest.updateMany({
        where: {
          donationId,
          id: { not: requestId },
          status: {
            in: ['REQUESTED', 'ACCEPTED'],
          },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // 3. Update donation state
      await tx.donation.update({
        where: { id: donationId },
        data: {
          status: 'SCHEDULED',
        },
      });

      return acceptedRequest;
    });
  }

  async cancelCollectionRequest(
    donorId: string,
    donationId: string,
    requestId: string,
  ) {
    const donation = await this.prisma.donation.findFirst({
      where: { id: donationId, donorId },
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    const request = await this.prisma.collectionRequest.findFirst({
      where: {
        id: requestId,
        donationId,
      },
    });

    if (!request) {
      throw new NotFoundException('Collection request not found');
    }

    if (!['REQUESTED', 'ACCEPTED'].includes(request.status)) {
      throw new BadRequestException(
        'Only REQUESTED or ACCEPTED requests can be cancelled',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Cancel the request
      const cancelledRequest = await tx.collectionRequest.update({
        where: { id: requestId },
        data: {
          status: 'CANCELLED',
        },
      });

      // 2. If it was accepted → revert donation state
      if (request.status === 'ACCEPTED') {
        await tx.donation.update({
          where: { id: donationId },
          data: {
            status: 'PENDING',
          },
        });
      }

      return cancelledRequest;
    });
  }

  async browseNGOs(queries: GetNGOsQueryDto) {
    const where: Record<string, unknown> = {
      verificationStatus: 'APPROVED',
    };

    if (queries.city) {
      where.city = queries.city;
    }

    if (queries.category) {
      where.acceptedCategories = {
        has: queries.category,
      };
    }

    if (queries.search) {
      where.orgName = {
        contains: queries.search,
        mode: 'insensitive',
      };
    }

    // GEO FILTER (raw SQL needed for proper distance calc)
    if (queries.lat && queries.lng) {
      return await this.prisma.$queryRawUnsafe(`
      SELECT *,
      (
        6371 * acos(
          cos(radians(${queries.lat})) *
          cos(radians("lat")) *
          cos(radians("lng") - radians(${queries.lng})) +
          sin(radians(${queries.lat})) *
          sin(radians("lat"))
        )
      ) AS distance
      FROM ngo_profiles
      WHERE "verificationStatus" = 'APPROVED'
      ${queries.category ? `AND '${queries.category}' = ANY("acceptedCategories")` : ''}
      ${queries.city ? `AND "city" = '${queries.city}'` : ''}
      ${queries.search ? `AND "orgName" ILIKE '%${queries.search}%'` : ''}
      HAVING distance < ${queries.radius}
      ORDER BY distance ASC
      LIMIT ${queries.limit}
      OFFSET ${(queries.page - 1) * queries.limit};
    `);
    }
    return await this.prisma.nGOProfile.findMany({
      where,
      skip: (queries.page - 1) * queries.limit,
      take: queries.limit,
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        orgName: true,
        city: true,
        state: true,
        rating: true,
        acceptedCategories: true,
      },
    });
  }
}
