import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '~/src/db/TypeOrmModule'
import { PinoLoggerModule } from '~/src/shared/Infrastructure/PinoLoggerModule'
import { SentryExceptionFilter } from '~/src/shared/Infrastructure/SentryExceptionFilter'

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule, PinoLoggerModule],
  controllers: [AppController],
  providers: [AppService, SentryExceptionFilter],
  exports: [SentryExceptionFilter],
})
export class AppModule {}
