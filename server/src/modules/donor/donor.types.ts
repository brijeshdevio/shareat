import z from 'zod';

import { CreateDonationSchema, DonorUpdateProfileSchema } from './donor.schema';

export type DonorUpdateProfileDto = z.infer<typeof DonorUpdateProfileSchema>;
export type CreateDonationDto = z.infer<typeof CreateDonationSchema>;
