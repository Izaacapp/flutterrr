import { z } from 'zod';  

const envSchema = z.object({  
  MONGO_URI: z.string(),  
  JWT_SECRET: z.string(),  
  PORT: z.coerce.number().default(3000),
  // Storage configuration
  STORAGE_TYPE: z.enum(['local', 'spaces']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  UPLOAD_URL: z.string().default('http://localhost:3000/uploads'),
  // DigitalOcean Spaces (optional for local dev)
  DO_SPACES_KEY: z.string().optional(),
  DO_SPACES_SECRET: z.string().optional(),
  DO_SPACES_ENDPOINT: z.string().optional(),
  DO_SPACES_BUCKET: z.string().optional(),
  DO_SPACES_REGION: z.string().optional(),
  // Mailtrap Email Service
  MAILTRAP_TOKEN: z.string().optional(),
  MAILTRAP_ENDPOINT: z.string().optional(),
});  

export const env = envSchema.parse(process.env);  