import z from 'zod';

export const DonorUpdateProfileSchema = z
  .object({
    address: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    pincode: z
      .string()
      .regex(/^[1-9][0-9]{5}$/)
      .optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
  .refine(
    (data) =>
      data.address ||
      data.city ||
      data.state ||
      data.pincode ||
      (data.lat !== undefined && data.lng !== undefined),
    {
      message: 'At least one location field is required',
    },
  )
  .strict();
