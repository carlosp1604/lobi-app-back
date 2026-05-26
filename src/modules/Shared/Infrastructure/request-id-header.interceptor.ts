import { tap } from 'rxjs/operators'
import { Observable } from 'rxjs'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'

@Injectable()
export class RequestIdHeaderInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        const ctx = context.switchToHttp()
        const response = ctx.getResponse<FastifyReply>()
        const request = ctx.getRequest<FastifyRequest>()

        const requestId = request.id

        if (requestId) {
          response.header('X-Request-Id', String(requestId))
        }
      }),
    )
  }
}
