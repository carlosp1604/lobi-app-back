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

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule, LoggerModule, RateLimitModule, SharedModule, AuthModule],
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
