import * as Sentry from '@sentry/node'
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'

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
  // TODO: Extract this code to a APIExceptionCodes file
  const INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'

  if (exception instanceof HttpException) {
    return exception.getResponse()
  }

  if (exception instanceof Error) {
    return {
      code: 'id' in exception ? exception.id : INTERNAL_SERVER_ERROR,
      message: exception.message,
    }
  }

  return {
    message: 'Internal server error',
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

        // TODO: Add user information from auth middleware
        // Sentry.setUser({})

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
      path: request.url,
    })
  }
}
