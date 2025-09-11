import { TypeOrmModule } from '@nestjs/typeorm'
import { env } from '~/src/shared/Infrastructure/EnvHelper'

export const DatabaseModule = TypeOrmModule.forRootAsync({
  useFactory: () => {
    return {
      type: 'postgres',
      host: env.DATABASE_HOST,
      database: env.DATABASE_NAME,
      username: env.DATABASE_USER,
      port: env.DATABASE_PORT,
      password: env.DATABASE_PASSWORD,
      logging: env.DATABASE_LOGGING,
      autoLoadEntities: true,
      synchronize: false,
      migrations: ['dist/migrations/*.js'],
      timezone: 'Z',
    }
  },
})
