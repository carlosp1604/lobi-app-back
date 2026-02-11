import { resolve } from 'path'
import { EnvSchema, Env } from './env.schema'
import { z } from 'zod'
import { config } from 'dotenv'

function loadEnvFile(): void {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const isCI = process.env.CI === 'true' || process.env.CI === '1'

  const projectRoot = process.cwd()

  const basePath = resolve(projectRoot, '.env')
  config({ path: basePath })

  if (isCI) {
    console.log('🤖 CI Environment detected: Loading .env.ci')
    const ciPath = resolve(projectRoot, '.env.ci')
    config({ path: ciPath, override: true })
  } else if (nodeEnv !== 'production') {
    const envFilePath = resolve(projectRoot, `.env.${nodeEnv}`)
    config({ path: envFilePath, override: true })
  }
}

loadEnvFile()

const parsedEnv = EnvSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', z.treeifyError(parsedEnv.error))
  throw new Error('Invalid environment variables')
}

export const env: Env = parsedEnv.data
