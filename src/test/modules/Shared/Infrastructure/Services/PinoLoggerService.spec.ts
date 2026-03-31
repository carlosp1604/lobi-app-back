import { mock, mockReset } from 'jest-mock-extended'
import type { Logger } from 'pino'
import { ClsService } from 'nestjs-cls'
import { PinoLoggerService } from '~/src/modules/Shared/Infrastructure/Services/PinoLoggerService'
import { ContextClsStore } from '~/src/modules/Shared/Infrastructure/ContextClsStore'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { UserIpMother } from '~/src/test/mothers/Infrastructure/UserIpMother'
import { UserAgentMother } from '~/src/test/mothers/Infrastructure/UserAgentMother'

describe('PinoLoggerService', () => {
  const pino = mock<Logger>()
  const cls = mock<ClsService<ContextClsStore>>()
  let logger: PinoLoggerService

  const DEFAULT_CONTEXT = 'TestContext'

  const requestId = IdentifierMother.valid()
  const requestIp = UserIpMother.valid()
  const requestUserAgent = UserAgentMother.valid()

  beforeEach(() => {
    mockReset(pino)
    mockReset(cls)
    cls.get.mockReturnValue(undefined)

    logger = new PinoLoggerService(pino, cls, DEFAULT_CONTEXT)
  })

  describe('Context Resolution', () => {
    it('should inject reqId, ip and userAgent when CLS data is present', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      cls.get.mockImplementation((key) => {
        if (key === 'requestId') return requestId
        if (key === 'ip') return requestIp
        if (key === 'ua') return requestUserAgent
        return undefined
      })

      logger.info('test message')

      expect(pino.info).toHaveBeenCalledWith(
        {
          context: DEFAULT_CONTEXT,
          reqId: requestId,
          ip: requestIp,
          userAgent: requestUserAgent,
        },
        'test message',
      )
    })

    it('should handle NestJS system context overriding the default one', () => {
      logger.log('startup message', 'NestFactory')

      expect(pino.info).toHaveBeenCalledWith({ context: 'NestFactory' }, 'startup message')
    })

    it('should merge CLS context, user metadata, and NestJS context correctly', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      cls.get.mockImplementation((key) => (key === 'requestId' ? requestId : undefined))

      logger.error('error message', 'stack-trace', { userId: 1 }, 'AuthService')

      expect(pino.error).toHaveBeenCalledWith(
        {
          reqId: requestId,
          userId: 1,
          context: 'AuthService',
          trace: 'stack-trace',
        },
        'error message',
      )
    })

    it('should ignore null and non-object metadata arguments', () => {
      logger.info('message with invalid metadata', null, 42, { valid: 'metadata' })

      expect(pino.info).toHaveBeenCalledWith(
        {
          context: DEFAULT_CONTEXT,
          valid: 'metadata',
        },
        'message with invalid metadata',
      )
    })
  })

  describe('debug', () => {
    it('should call logger correctly with metadata', () => {
      logger.debug('debug message', { metaProp: 'metaValue' })

      expect(pino.debug).toHaveBeenCalledWith({ context: DEFAULT_CONTEXT, metaProp: 'metaValue' }, 'debug message')
    })

    it('should call logger correctly without metadata', () => {
      logger.debug('debug message')

      expect(pino.debug).toHaveBeenCalledWith({ context: DEFAULT_CONTEXT }, 'debug message')
    })
  })

  describe('error', () => {
    it('should call logger correctly with stack and metadata', () => {
      logger.error('error message', 'stack trace', { metaProp: 'metaValue' })

      expect(pino.error).toHaveBeenCalledWith(
        { context: DEFAULT_CONTEXT, trace: 'stack trace', metaProp: 'metaValue' },
        'error message',
      )
    })

    it('should call logger correctly without metadata', () => {
      logger.error('error message', 'stack trace')

      expect(pino.error).toHaveBeenCalledWith({ context: DEFAULT_CONTEXT, trace: 'stack trace' }, 'error message')
    })

    it('should call logger correctly without trace, but with metadata', () => {
      logger.error('error message', undefined, { metaProp: 'metaValue' })

      expect(pino.error).toHaveBeenCalledWith({ context: DEFAULT_CONTEXT, metaProp: 'metaValue' }, 'error message')
    })
  })

  describe('log', () => {
    it('should call logger correctly with metadata', () => {
      logger.log('log message', { metaProp: 'metaValue' })

      expect(pino.info).toHaveBeenCalledWith({ context: DEFAULT_CONTEXT, metaProp: 'metaValue' }, 'log message')
    })

    it('should call logger correctly without metadata', () => {
      logger.log('log message')

      expect(pino.info).toHaveBeenCalledWith({ context: DEFAULT_CONTEXT }, 'log message')
    })
  })

  describe('info', () => {
    it('should call logger correctly with metadata', () => {
      logger.info('info message', { metaProp: 'metaValue' })

      expect(pino.info).toHaveBeenCalledWith({ context: DEFAULT_CONTEXT, metaProp: 'metaValue' }, 'info message')
    })

    it('should call logger correctly without metadata', () => {
      logger.info('info message')

      expect(pino.info).toHaveBeenCalledWith({ context: DEFAULT_CONTEXT }, 'info message')
    })
  })

  describe('warn', () => {
    it('should call logger correctly with metadata', () => {
      logger.warn('warn message', { metaProp: 'metaValue' })

      expect(pino.warn).toHaveBeenCalledWith({ context: DEFAULT_CONTEXT, metaProp: 'metaValue' }, 'warn message')
    })

    it('should call logger correctly without metadata', () => {
      logger.warn('warn message')

      expect(pino.warn).toHaveBeenCalledWith({ context: DEFAULT_CONTEXT }, 'warn message')
    })
  })

  describe('verbose', () => {
    it('should call logger correctly with metadata', () => {
      logger.verbose('verbose message', { metaProp: 'metaValue' })

      expect(pino.trace).toHaveBeenCalledWith({ context: DEFAULT_CONTEXT, metaProp: 'metaValue' }, 'verbose message')
    })

    it('should call logger correctly without metadata', () => {
      logger.verbose('verbose message')

      expect(pino.trace).toHaveBeenCalledWith({ context: DEFAULT_CONTEXT }, 'verbose message')
    })
  })
})
