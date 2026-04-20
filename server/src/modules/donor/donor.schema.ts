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

export const ItemCategory = z.enum([
  'CLOTHES',
  'BLANKETS',
  'HOUSEHOLD',
  'BOOKS',
  'FOOTWEAR',
  'TOYS',
  'OTHER',
]);

export const ItemCondition = z.enum(['NEW', 'GOOD', 'FAIR']);

export const itemSchema = z.object({
  name: z.string().trim().min(1, 'Item name required'),
  category: ItemCategory,
  quantity: z.number().int().positive(),
  condition: ItemCondition,
});

export const CreateDonationSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, 'Title must be at least 5 characters')
      .max(50, 'Title must be at most 50 characters'),
    description: z.string().trim().optional(),
    category: ItemCategory,
    pickupAddress: z.string().trim().min(1),
    pickupCity: z.string().trim().min(1),
    pickupState: z.string().trim().optional(),
    pickupPincode: z
      .string()
      .regex(/^[1-9][0-9]{5}$/, 'Invalid pincode')
      .optional(),
    pickupLat: z.number().min(-90).max(90).optional(),
    pickupLng: z.number().min(-180).max(180).optional(),
    photos: z.array(z.url()).optional(),
    items: z.array(itemSchema).min(1, 'At least one item required'),
  })
  .strict();

export const DonationStatusEnum = z.enum([
  'DRAFT',
  'PENDING',
  'SCHEDULED',
  'COLLECTED',
  'COMPLETED',
  'CANCELLED',
]);

export const GetDonationsQuerySchema = z
  .object({
    status: DonationStatusEnum.optional(),
    category: ItemCategory.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();

export const UpdateDonationSchema = z
  .object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().min(10).optional(),
    category: ItemCategory.optional(),
    pickupAddress: z.string().min(5).optional(),
    pickupCity: z.string().min(2).optional(),
    pickupPincode: z
      .string()
      .regex(/^\d{6}$/)
      .optional(),
    photos: z.array(z.url()).max(10).optional(),
    items: z
      .array(
        z.object({
          name: z.string().min(2),
          category: ItemCategory,
          quantity: z.number().int().min(1),
          condition: ItemCondition,
        }),
      )
      .min(1)
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided',
  );
