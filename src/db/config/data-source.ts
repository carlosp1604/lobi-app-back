import 'reflect-metadata'
import { DataSource } from 'typeorm'
import dotenv from 'dotenv'
// eslint-disable-next-line no-restricted-imports
import { env } from '../../modules/Shared/Infrastructure/env.loader'

dotenv.config()

export default new DataSource({
  type: 'postgres',
  host: env.DATABASE_HOST,
  database: env.DATABASE_NAME,
  username: env.DATABASE_USER,
  port: env.DATABASE_PORT,
  password: env.DATABASE_PASSWORD,
  logging: env.DATABASE_LOGGING,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/db/migrations/*.ts'],
  synchronize: false,
})
