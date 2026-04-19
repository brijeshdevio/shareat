import z from 'zod';

import { DonorUpdateProfileSchema } from './donor.schema';

export type DonorUpdateProfileDto = z.infer<typeof DonorUpdateProfileSchema>;
