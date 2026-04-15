import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DonationService {
  constructor(private readonly prismaService: PrismaService) {}
}
