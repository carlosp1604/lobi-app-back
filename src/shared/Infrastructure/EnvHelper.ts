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
  })
  .transform((env) => ({
    ...env,
    isProduction: env.NODE_ENV === 'production',
  }))

export type Env = z.infer<typeof EnvSchema>

export const env: Env = EnvSchema.parse(process.env)
