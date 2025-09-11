import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { env } from '~/src/shared/Infrastructure/EnvHelper'

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: env.RATE_WINDOW_MS,
        limit: env.RATE_MAX,
      },
    ]),
  ],
})
export class RateLimitModule {}
