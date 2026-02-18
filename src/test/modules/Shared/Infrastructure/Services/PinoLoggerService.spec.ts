import { mock, mockReset } from 'jest-mock-extended'
import type { Logger } from 'pino'
import { ClsService } from 'nestjs-cls'
import { PinoLoggerService } from '~/src/modules/Shared/Infrastructure/Services/PinoLoggerService'
import { ContextClsStore } from '~/src/modules/Shared/Infrastructure/ContextClsStore'

describe('PinoLoggerService', () => {
  const pino = mock<Logger>()
  const cls = mock<ClsService<ContextClsStore>>()
  let logger: PinoLoggerService

  beforeEach(() => {
    mockReset(pino)
    mockReset(cls)
    cls.get.mockReturnValue(undefined)

    logger = new PinoLoggerService(pino, cls)
  })

  describe('Context Resolution', () => {
    it('should inject requestContext when CLS data is present', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      cls.get.mockImplementation((key) => {
        if (key === 'requestId') return 'req-123'
        if (key === 'ip') return '127.0.0.1'
        if (key === 'ua') return 'TestBot'
        return undefined
      })

      logger.info('test message')

      expect(pino.info).toHaveBeenCalledWith(
        {
          requestContext: {
            requestId: 'req-123',
            ip: '127.0.0.1',
            ua: 'TestBot',
          },
        },
        'test message',
      )
    })

    it('should handle NestJS system context', () => {
      logger.log('startup message', 'NestFactory')

      expect(pino.info).toHaveBeenCalledWith({ context: 'NestFactory' }, 'startup message')
    })

    it('should merge CLS context, user metadata, and NestJS context correctly', () => {
      cls.get.mockReturnValueOnce('req-123')

      logger.error('error message', 'stack-trace', { userId: 1 }, 'AuthService')

      expect(pino.error).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          requestContext: expect.objectContaining({ requestId: 'req-123' }),
          userId: 1,
          context: 'AuthService',
          trace: 'stack-trace',
        }),
        'error message',
      )
    })
  })

  describe('debug', () => {
    it('should call logger correctly with metadata', () => {
      logger.debug('debug message', { metaProp: 'metaValue' })

      expect(pino.debug).toHaveBeenCalledWith({ metaProp: 'metaValue' }, 'debug message')
    })

    it('should call logger correctly without metadata', () => {
      logger.debug('debug message')

      expect(pino.debug).toHaveBeenCalledWith({}, 'debug message')
    })
  })

  describe('error', () => {
    it('should call logger correctly with stack and metadata', () => {
      logger.error('error message', 'stack trace', { metaProp: 'metaValue' })

      expect(pino.error).toHaveBeenCalledWith({ trace: 'stack trace', metaProp: 'metaValue' }, 'error message')
    })

    it('should call logger correctly without metadata', () => {
      logger.error('error message', 'stack trace')

      expect(pino.error).toHaveBeenCalledWith({ trace: 'stack trace' }, 'error message')
    })

    it('should call logger correctly without trace, but with metadata', () => {
      logger.error('error message', undefined, { metaProp: 'metaValue' })

      expect(pino.error).toHaveBeenCalledWith({ metaProp: 'metaValue' }, 'error message')
    })
  })

  describe('log', () => {
    it('should call logger correctly with metadata', () => {
      logger.log('log message', { metaProp: 'metaValue' })

      expect(pino.info).toHaveBeenCalledWith({ metaProp: 'metaValue' }, 'log message')
    })

    it('should call logger correctly without metadata', () => {
      logger.log('log message')

      expect(pino.info).toHaveBeenCalledWith({}, 'log message')
    })
  })

  describe('info', () => {
    it('should call logger correctly with metadata', () => {
      logger.info('info message', { metaProp: 'metaValue' })

      expect(pino.info).toHaveBeenCalledWith({ metaProp: 'metaValue' }, 'info message')
    })

    it('should call logger correctly without metadata', () => {
      logger.info('info message')

      expect(pino.info).toHaveBeenCalledWith({}, 'info message')
    })
  })

  describe('warn', () => {
    it('should call logger correctly with metadata', () => {
      logger.warn('warn message', { metaProp: 'metaValue' })

      expect(pino.warn).toHaveBeenCalledWith({ metaProp: 'metaValue' }, 'warn message')
    })

    it('should call logger correctly without metadata', () => {
      logger.warn('warn message')

      expect(pino.warn).toHaveBeenCalledWith({}, 'warn message')
    })
  })

  describe('verbose', () => {
    it('should call logger correctly with metadata', () => {
      logger.verbose('verbose message', { metaProp: 'metaValue' })

      expect(pino.trace).toHaveBeenCalledWith({ metaProp: 'metaValue' }, 'verbose message')
    })

    it('should call logger correctly without metadata', () => {
      logger.verbose('verbose message')

      expect(pino.trace).toHaveBeenCalledWith({}, 'verbose message')
    })
  })
})
