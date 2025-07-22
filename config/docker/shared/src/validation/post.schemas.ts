import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string()
    .min(1, 'Post cannot be empty')
    .max(280, 'Post cannot be longer than 280 characters'),
});

export const postSchema = createPostSchema.extend({
  _id: z.string(),
  createdAt: z.string(),
});

// Export inferred types HERE (removes need for post.types.ts)
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type Post = z.infer<typeof postSchema>;