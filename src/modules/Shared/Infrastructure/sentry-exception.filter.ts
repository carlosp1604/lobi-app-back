import * as Sentry from '@sentry/node'
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'
import { INTERNAL_SERVER_ERROR } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { JwtPayload } from '~/src/modules/Auth/Infrastructure/jwt-payload.schema'

function safeRedactBody(body: unknown): unknown {
  if (!body) {
    return undefined
  }

  const redactKeys = new Set(['password', 'token', 'access_token', 'refresh_token', 'authorization'])

  try {
    const stringBody = JSON.stringify(body, (key, value: unknown) => (redactKeys.has(key.toLowerCase()) ? '[redacted]' : value))

    return JSON.parse(stringBody)
  } catch {
    if (Buffer.isBuffer(body)) {
      return '[buffer]'
    }

    return '[unserializable]'
  }
}

function toSafeResponse(exception: unknown): object | string {
  if (exception instanceof HttpException) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (exception.getStatus() !== HttpStatus.INTERNAL_SERVER_ERROR) {
      return exception.getResponse()
    }
  }

  return {
    message: 'Something went wrong while processing your request',
    code: INTERNAL_SERVER_ERROR,
  }
}

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp()
    const response = context.getResponse<FastifyReply>()
    const request = context.getRequest<FastifyRequest>()

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const safeResponse = toSafeResponse(exception)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      const route = request.routeOptions?.url ?? request.url
      const urlWithoutQuery = (request.url || '').split('?')[0]

      const headers = { ...request.headers }
      delete headers.authorization
      delete headers.cookie
      delete headers['set-cookie']

      const safeBody = safeRedactBody(request.body)

      Sentry.withScope((scope) => {
        scope.setTag('request_id', String(request.id))
        scope.setTag('status', String(status))
        scope.setTag('method', request.method)
        scope.setTag('route', route)
        scope.setTag('url', urlWithoutQuery)

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const user: JwtPayload | undefined = request['user']

        if (user) {
          Sentry.setUser({
            id: user.sub,
            sessionId: user.sid,
          })
          Sentry.setTag('session_id', user.sid)
        } else {
          Sentry.setUser(null)
        }

        scope.setContext('request', {
          method: request.method,
          url: urlWithoutQuery,
          query: request.query,
          params: request.params,
          headers: headers,
          ip: request.ip,
        })

        if (safeBody !== undefined) {
          scope.setExtra('body', safeBody)
        }

        scope.setTransactionName(`${request.method} ${route}`)
        scope.setFingerprint(['{{ default }}', request.method, route, String(status)])

        Sentry.captureException(exception)
      })
    }

    if (response.sent || response.raw?.headersSent || response.raw?.writableEnded) {
      return
    }

    response.status(status).send({
      statusCode: status,
      response: safeResponse,
      timestamp: new Date().toISOString(),
      requestId: String(request.id),
      path: request.url,
    })
  }
}
