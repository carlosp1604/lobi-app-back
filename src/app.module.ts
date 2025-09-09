import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '~/src/db/TypeOrmModule'
import { PinoLoggerModule } from '~/src/shared/Infrastructure/PinoLoggerModule'

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule, PinoLoggerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
