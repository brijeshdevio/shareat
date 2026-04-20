import z from 'zod';

import {
  CreateDonationSchema,
  DonorUpdateProfileSchema,
  GetDonationsQuerySchema,
} from './donor.schema';

export type DonorUpdateProfileDto = z.infer<typeof DonorUpdateProfileSchema>;
export type CreateDonationDto = z.infer<typeof CreateDonationSchema>;
export type GetDonationsQueryDto = z.infer<typeof GetDonationsQuerySchema>;
