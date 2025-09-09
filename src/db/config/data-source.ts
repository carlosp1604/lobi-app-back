import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { getDatabaseConfig } from './index'
import dotenv from 'dotenv'

dotenv.config()

const databaseConfig = getDatabaseConfig()

export default new DataSource({
  type: 'postgres',
  host: databaseConfig.host,
  database: databaseConfig.database,
  username: databaseConfig.username,
  port: databaseConfig.port,
  password: databaseConfig.password,
  logging: databaseConfig.logging,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/db/migrations/*.ts'],
  synchronize: false,
})
