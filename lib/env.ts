import { z } from 'zod';

// Environment variable schema for runtime validation
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BASE_URL: z.string().url().optional(),

  // Auth / Security
  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 characters').optional(),
  SINGLE_USER_MODE: z.string().optional(),
  ADMIN_ACCESS_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),

  // Database
  POSTGRES_URL: z.string().url().optional(),

  // Memory Service / Gateway
  MEMORY_SERVICE_URL: z.string().url().optional(),
  MEMORY_SERVICE_SECRET: z.string().optional(),
  NEXT_PUBLIC_MEMORY_API_URL: z.string().optional(),
  NEXT_PUBLIC_MEMORY_API_KEY: z.string().optional(),
  NEXT_PUBLIC_GATEWAY_URL: z.string().optional(),

  // MCP
  NEXT_PUBLIC_MCP_SERVER_URL: z.string().optional(),
  NEXT_PUBLIC_MCP_MODE: z.enum(['auto', 'local', 'remote']).optional(),
  NEXT_PUBLIC_ENABLE_MCP: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Apple App Store Connect
  ENABLE_APPLE_CONNECT: z.string().optional(),
  APPLE_ISSUER_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(), // can be raw or base64
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);

export function isProduction() {
  return env.NODE_ENV === 'production';
}

export function boolFromEnv(value: string | undefined, defaultValue = false) {
  if (value === undefined) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}
