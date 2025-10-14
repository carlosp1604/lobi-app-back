import type { Logger } from 'pino'
import { mock, mockReset } from 'jest-mock-extended'
import { PinoLoggerService } from '~/src/modules/Shared/Infrastructure/Services/PinoLoggerService'

describe('PinoLoggerService', () => {
  const pino = mock<Logger>()

  beforeEach(() => {
    mockReset(pino)
  })

  describe('debug', () => {
    it('should call logger correctly with metadata', () => {
      const logger = new PinoLoggerService(pino)

      logger.debug('debug message', { metaProp: 'metaValue' })

      expect(pino.debug).toHaveBeenCalledWith({ metaProp: 'metaValue' }, 'debug message')
    })

    it('should call logger correctly without metadata', () => {
      const logger = new PinoLoggerService(pino)

      logger.debug('debug message')

      expect(pino.debug).toHaveBeenCalledWith({}, 'debug message')
    })
  })

  describe('error', () => {
    it('should call logger correctly with stack and metadata', () => {
      const logger = new PinoLoggerService(pino)

      logger.error('error message', 'stack trace', { metaProp: 'metaValue' })

      expect(pino.error).toHaveBeenCalledWith({ trace: 'stack trace', metaProp: 'metaValue' }, 'error message')
    })

    it('should call logger correctly without metadata', () => {
      const logger = new PinoLoggerService(pino)

      logger.error('error message', 'stack trace')

      expect(pino.error).toHaveBeenCalledWith({ trace: 'stack trace' }, 'error message')
    })

    it('should call logger correctly without stack, but with metadata', () => {
      const logger = new PinoLoggerService(pino)

      logger.error('error message', undefined, { metaProp: 'metaValue' })

      expect(pino.error).toHaveBeenCalledWith({ metaProp: 'metaValue' }, 'error message')
    })
  })

  describe('log', () => {
    it('should call logger correctly with metadata', () => {
      const logger = new PinoLoggerService(pino)

      logger.log('log message', { metaProp: 'metaValue' })

      expect(pino.info).toHaveBeenCalledWith({ metaProp: 'metaValue' }, 'log message')
    })

    it('should call logger correctly without metadata', () => {
      const logger = new PinoLoggerService(pino)

      logger.log('log message')

      expect(pino.info).toHaveBeenCalledWith({}, 'log message')
    })
  })

  describe('info', () => {
    it('should call logger correctly with metadata', () => {
      const logger = new PinoLoggerService(pino)

      logger.info('info message', { metaProp: 'metaValue' })

      expect(pino.info).toHaveBeenCalledWith({ metaProp: 'metaValue' }, 'info message')
    })

    it('should call logger correctly without metadata', () => {
      const logger = new PinoLoggerService(pino)

      logger.info('info message')

      expect(pino.info).toHaveBeenCalledWith({}, 'info message')
    })
  })

  describe('warn', () => {
    it('should call logger correctly with metadata', () => {
      const logger = new PinoLoggerService(pino)

      logger.warn('warn message', { metaProp: 'metaValue' })

      expect(pino.warn).toHaveBeenCalledWith({ metaProp: 'metaValue' }, 'warn message')
    })

    it('should call logger correctly without metadata', () => {
      const logger = new PinoLoggerService(pino)

      logger.warn('warn message')

      expect(pino.warn).toHaveBeenCalledWith({}, 'warn message')
    })
  })

  describe('verbose', () => {
    it('should call logger correctly with metadata', () => {
      const logger = new PinoLoggerService(pino)

      logger.verbose('verbose message', { metaProp: 'metaValue' })

      expect(pino.trace).toHaveBeenCalledWith({ metaProp: 'metaValue' }, 'verbose message')
    })

    it('should call logger correctly without metadata', () => {
      const logger = new PinoLoggerService(pino)

      logger.verbose('verbose message')

      expect(pino.trace).toHaveBeenCalledWith({}, 'verbose message')
    })
  })
})
