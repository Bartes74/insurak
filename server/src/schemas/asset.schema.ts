import { z } from 'zod';

export const createAssetSchema = z.object({
    name: z.string().min(1, 'Nazwa jest wymagana'),
    type: z.enum(['VEHICLE', 'MACHINE', 'OTHER']).default('OTHER'),
    identifier: z.string().min(1, 'Identyfikator jest wymagany'),
    responsiblePerson: z.string().optional(),
    notes: z.string().optional(),
    // Policy fields (optional for initial creation if purely asset, but combined in current controller)
    policyNumber: z.string().optional(),
    insurer: z.string().optional(),
    validFrom: z.string().optional(), // Date string YYYY-MM-DD
    validUntil: z.string().optional(),
    premium: z.number().optional(),
    sumInsured: z.number().optional(),
    paymentFrequency: z.enum(['YEARLY', 'MONTHLY', 'QUARTERLY']).optional(),
    leasingRef: z.string().optional(),
    insured: z.string().optional(),
    comments: z.string().optional(),
    notificationOverrideDays: z.number().int().optional(),
    files: z.array(z.any()).optional(), // We accept JSON object/array from client for now
});

export const updateAssetSchema = createAssetSchema.partial();

export const renewPolicySchema = z.object({
    policyNumber: z.string().min(1),
    insurer: z.string().min(1),
    validFrom: z.string(),
    validUntil: z.string(),
    premium: z.number().min(0),
    sumInsured: z.number().optional(),
    paymentFrequency: z.enum(['YEARLY', 'MONTHLY', 'QUARTERLY']).optional(),
    leasingRef: z.string().optional(),
    insured: z.string().optional(),
    comments: z.string().optional(),
    notificationOverrideDays: z.number().int().optional(),
    files: z.array(z.any()).optional(),
});
