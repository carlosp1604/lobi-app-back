import * as Sentry from '@sentry/node'
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common'
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

function toSafeMessage(exception: unknown): string {
  const defaultMessage = 'Internal server error'

  const rawResponse = exception instanceof HttpException ? exception.getResponse() : (exception as Error)?.message || defaultMessage

  let safeMessage = defaultMessage

  if (typeof rawResponse === 'string') {
    safeMessage = rawResponse
  }

  if (typeof rawResponse === 'object') {
    if (rawResponse && 'message' in rawResponse && typeof rawResponse.message === 'string') {
      safeMessage = rawResponse.message
    }
  }

  return safeMessage
}

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp()
    const response = context.getResponse<FastifyReply>()
    const request = context.getRequest<FastifyRequest>()

    const status = exception instanceof HttpException ? exception.getStatus() : 500

    const rawResponse =
      exception instanceof HttpException ? exception.getResponse() : (exception as Error)?.message || 'Internal server error'

    const safeMessage = toSafeMessage(rawResponse)

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

    if (response.sent || response.raw?.headersSent || response.raw?.writableEnded) {
      return
    }

    response.status(status).send({
      statusCode: status,
      message: safeMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
