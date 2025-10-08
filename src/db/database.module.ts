import { Global, Module } from '@nestjs/common'
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm'
import { env } from '~/src/modules/Shared/Infrastructure/EnvHelper'
import { DataSource } from 'typeorm'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { TypeOrmUnitOfWork } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { TYPEORM_MANAGER_RESOLVER, UNIT_OF_WORK } from '~/src/db/config/typeorm.tokens'

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: env.DATABASE_HOST,
        database: env.DATABASE_NAME,
        username: env.DATABASE_USER,
        port: env.DATABASE_PORT,
        password: env.DATABASE_PASSWORD,
        logging: env.DATABASE_LOGGING,
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
      }),
    }),
  ],
  providers: [
    {
      provide: TYPEORM_MANAGER_RESOLVER,
      useFactory: (dataSource: DataSource) => {
        return new TypeOrmManagerResolver(dataSource)
      },
      inject: [getDataSourceToken()],
    },
    {
      provide: UNIT_OF_WORK,
      useFactory: (dataSource: DataSource) => {
        return new TypeOrmUnitOfWork(dataSource)
      },
      inject: [getDataSourceToken()],
    },
  ],
  exports: [TypeOrmModule, TYPEORM_MANAGER_RESOLVER, UNIT_OF_WORK],
})
export class DatabaseModule {}
