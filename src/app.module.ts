import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '~/src/db/TypeOrmModule'
import { PinoLoggerModule } from '~/src/shared/Infrastructure/Module/PinoLoggerModule'
import { SentryExceptionFilter } from '~/src/shared/Infrastructure/SentryExceptionFilter'
import { RateLimitModule } from '~/src/shared/Infrastructure/Module/RateLimitModule'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard } from '@nestjs/throttler'

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule, PinoLoggerModule, RateLimitModule],
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
