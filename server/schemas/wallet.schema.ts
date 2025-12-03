import { z } from 'zod';

export const addWalletSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  address: z.string().min(1, "Wallet address is required").regex(/^0x[a-fA-F0-9]{40}$|^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^[a-zA-Z0-9]{44}$/, "Invalid wallet address format"),
  label: z.enum(['primary', 'secondary']).optional()
});

export const updateWalletSchema = z.object({
  label: z.enum(['primary', 'secondary'], {
    required_error: 'Label is required',
    invalid_type_error: 'Label must be either "primary" or "secondary"'
  })
});

export type AddWalletData = z.infer<typeof addWalletSchema>;
export type UpdateWalletData = z.infer<typeof updateWalletSchema>;