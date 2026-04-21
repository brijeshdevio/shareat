import z from 'zod';

import {
  CreateCollectionRequestSchema,
  CreateDonationSchema,
  DonorUpdateProfileSchema,
  GetDonationsQuerySchema,
  UpdateDonationSchema,
} from './donor.schema';

export type DonorUpdateProfileDto = z.infer<typeof DonorUpdateProfileSchema>;
export type CreateDonationDto = z.infer<typeof CreateDonationSchema>;
export type GetDonationsQueryDto = z.infer<typeof GetDonationsQuerySchema>;
export type UpdateDonationDto = z.infer<typeof UpdateDonationSchema>;
export type CreateCollectionRequestDto = z.infer<
  typeof CreateCollectionRequestSchema
>;
