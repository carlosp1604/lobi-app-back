import { z } from 'zod'
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from '~/src/modules/Shared/Infrastructure/logger.module'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard } from '@nestjs/throttler'
import { SharedModule } from '~/src/modules/Shared/Infrastructure/shared.module'
import { AuthModule } from '~/src/modules/Auth/Infrastructure/auth.module'
import { DatabaseModule } from '~/src/db/database.module'
import { SentryExceptionFilter } from '~/src/modules/Shared/Infrastructure/sentry-exception.filter'
import { RateLimitModule } from '~/src/modules/Shared/Infrastructure/rate-limit.module'
import { EnvSchema } from '~/src/modules/Shared/Infrastructure/env.schema'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validate: (config) => {
        const result = EnvSchema.safeParse(config)

        if (!result.success) {
          console.error('❌ Invalid environment variables:', z.treeifyError(result.error))
          throw new Error('Invalid environment variables')
        }

        return result.data
      },
    }),
    DatabaseModule,
    LoggerModule,
    RateLimitModule,
    SharedModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SentryExceptionFilter,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [SentryExceptionFilter],
})
export class AppModule {}
