import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const CorsOriginsSchema = z
  .string()
  .refine((value) => value.trim() !== '*', {
    message: 'CORS_ORIGINS cannot be * when credentials: true',
  })
  .transform((value) => {
    return value
      .trim()
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin !== '')
  })
  .refine((arr) => arr.length > 0, {
    message: 'CORS_ORIGINS cannot be empty',
  })

export const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),

    DATABASE_HOST: z.string(),
    DATABASE_PORT: z.coerce.number().int().positive().default(5432),
    DATABASE_USER: z.string(),
    DATABASE_PASSWORD: z.string(),
    DATABASE_NAME: z.string(),
    DATABASE_LOGGING: z.coerce.boolean().optional().default(false),

    SENTRY_DSN: z.url().optional(),
    SENTRY_ENV: z.string().optional().default('development'),
    SENTRY_RELEASE: z.string().optional(),

    CORS_ORIGINS: CorsOriginsSchema,
    BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(1048576),
    TRUST_PROXY: z.coerce.boolean().optional().default(false),
    RATE_MAX: z.coerce.number().int().positive().default(200),
    RATE_WINDOW_MS: z.coerce.number().int().positive().default(60000),

    API_DOCS_TITLE: z.string(),
    API_DOCS_DESCRIPTION: z.string(),
    API_DOCS_VERSION: z.string(),

    ACCESS_TTL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60 * 1000),
    ACCESS_ISSUER: z.url().default('http://localhost:3000'),
    ACCESS_AUDIENCE: z
      .string()
      .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid audience')
      .default('lobi-web'),
    ACCESS_SECRET: z.string().trim().min(64, { message: 'ACCESS_SECRET must have at least 64 characters' }),
    REFRESH_TTL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(7 * 24 * 60 * 60 * 1000),
    SALT_ROUNDS: z.coerce.number().int().positive().default(12),
    HASH_SECRET: z.string().trim().min(32, { message: 'HASH_SECRET must have at least 32 characters' }),
    USER_MAX_SESSIONS: z.coerce.number().int().positive().default(6),

    COOKIE_SECRET: z.string().trim().min(64, { message: 'COOKIE_SECRET must has at least 64 characters' }),
  })
  .transform((env) => ({
    ...env,
    isProduction: env.NODE_ENV === 'production',
  }))

export type Env = z.infer<typeof EnvSchema>

export const env: Env = EnvSchema.parse(process.env)
