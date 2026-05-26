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
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { ContextModule } from '~/src/modules/Shared/Infrastructure/context.module'
import { ActivityModule } from '~/src/modules/Activity/Infrastructure/activity.module'
import { UserModule } from '~/src/modules/User/Infrastructure/user.module'
import { RequestIdHeaderInterceptor } from '~/src/modules/Shared/Infrastructure/request-id-header.interceptor'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => env],
    }),
    DatabaseModule,
    LoggerModule,
    RateLimitModule,
    SharedModule,
    ContextModule,
    AuthModule,
    ActivityModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SentryExceptionFilter,
    RequestIdHeaderInterceptor,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [SentryExceptionFilter, ConfigModule],
})
export class AppModule {}
