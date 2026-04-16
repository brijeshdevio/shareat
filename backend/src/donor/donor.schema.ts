import z from 'zod';

export const DonorProfileSchema = z
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

// ========== New Donation Schema ==========
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

// ========== Update Donation Schema ==========
export const UpdateDonationSchema = z
  .object({
    title: z.string().trim().min(5, 'Title must be at least 5 characters'),
    description: z.string().trim().optional(),
    category: ItemCategory.optional(),
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
  .refine(
    (data) =>
      data.title ||
      data.description ||
      data.category ||
      data.pickupAddress ||
      data.pickupCity ||
      data.pickupState ||
      data.pickupPincode ||
      (data.pickupLat !== undefined && data.pickupLng !== undefined) ||
      data.photos?.length ||
      data.items?.length,
    {
      message: 'At least one field is required',
    },
  )
  .strict();

// ========== Types ==========
export type DonorProfileDto = z.infer<typeof DonorProfileSchema>;
export type CreateDonationDto = z.infer<typeof CreateDonationSchema>;
export type UpdateDonationDto = z.infer<typeof UpdateDonationSchema>;
