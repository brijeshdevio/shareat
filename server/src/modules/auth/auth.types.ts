import z from 'zod';

import { RegisterSchema } from './auth.schema';

export type RegisterDto = z.infer<typeof RegisterSchema>;
