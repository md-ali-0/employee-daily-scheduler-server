import { z } from 'zod';

export const fileIdSchema = z.object({
  id: z.string().uuid('Invalid file ID format'),
});
