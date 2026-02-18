import { ClsModule } from 'nestjs-cls'
import { FastifyRequest } from 'fastify'
import { ContextClsStore } from '~/src/modules/Shared/Infrastructure/ContextClsStore'
import { Module, Global } from '@nestjs/common'

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req: FastifyRequest) => {
          const requestId = req.id || (req.headers['x-request-id'] as string) || 'unknown'

          const rawIp = req.ip || 'unknown'
          const safeIp = rawIp.length > 39 ? rawIp.substring(0, 39) : rawIp

          const rawUa = (req.headers['user-agent'] as string) || 'unknown'
          const safeUa = rawUa.length > 512 ? rawUa.substring(0, 512) : rawUa

          cls.set<ContextClsStore>('requestId', requestId)
          cls.set<ContextClsStore>('ip', safeIp)
          cls.set<ContextClsStore>('ua', safeUa)
        },
      },
    }),
  ],
  exports: [ClsModule],
})
export class ContextModule {}
