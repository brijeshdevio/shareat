import z from 'zod';

import { LoginSchema, RegisterSchema } from './auth.schema';

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
