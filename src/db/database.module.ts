import { Global, Module } from '@nestjs/common'
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { TypeOrmUnitOfWork } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { TYPEORM_MANAGER_RESOLVER, UNIT_OF_WORK } from '~/src/db/config/typeorm.tokens'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService<Env, true>) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', { infer: true }),
        database: configService.get('DATABASE_NAME', { infer: true }),
        username: configService.get('DATABASE_USER', { infer: true }),
        port: configService.get('DATABASE_PORT', { infer: true }),
        password: configService.get('DATABASE_PASSWORD', { infer: true }),
        logging: configService.get('DATABASE_LOGGING', { infer: true }),
        ssl: configService.get('DATABASE_SSL', { infer: true }) ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
      }),
      inject: [ConfigService],
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
