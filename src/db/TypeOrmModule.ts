// src/db/TypeOrmModule.ts
import { TypeOrmModule } from '@nestjs/typeorm'
import { getDatabaseConfig } from '~/src/db/config'

export const DatabaseModule = TypeOrmModule.forRootAsync({
  useFactory: () => {
    const databaseConfig = getDatabaseConfig()

    return {
      type: 'postgres',
      ...databaseConfig,
      autoLoadEntities: true,
      synchronize: false,
      migrations: ['dist/migrations/*.js'],
      timezone: 'Z',
    }
  },
})
