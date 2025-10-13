import { resolve } from 'path'
import { EnvSchema, Env } from './env.schema'
import { z } from 'zod'
import { config } from 'dotenv'

function loadEnvFile(): void {
  const nodeEnv = process.env.NODE_ENV || 'development'

  const basePath = resolve(__dirname, '../../../../.env')
  config({ path: basePath })

  if (nodeEnv !== 'production') {
    const envFilePath = resolve(__dirname, `../../../../.env.${nodeEnv}`)
    config({ path: envFilePath })
  }
}

loadEnvFile()

const parsedEnv = EnvSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', z.treeifyError(parsedEnv.error))
  throw new Error('Invalid environment variables')
}

export const env: Env = parsedEnv.data
