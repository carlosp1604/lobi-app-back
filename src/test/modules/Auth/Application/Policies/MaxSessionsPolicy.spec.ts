import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'

describe('MaxSessionsPolicy', () => {
  describe('constructor', () => {
    it('should create an instance with a valid positive integer', () => {
      expect(() => new MaxSessionsPolicy(5)).not.toThrow()
    })

    it('should throw a RangeError if maxSessions is zero', () => {
      expect(() => new MaxSessionsPolicy(0)).toThrow(RangeError('MaxSessionsPolicy: maxSessions must be a positive integer'))
    })

    it('should throw a RangeError if maxSessions is a negative number', () => {
      expect(() => new MaxSessionsPolicy(-1)).toThrow(RangeError('MaxSessionsPolicy: maxSessions must be a positive integer'))
    })

    it('should throw a RangeError if maxSessions is a floating-point number', () => {
      expect(() => new MaxSessionsPolicy(3.14)).toThrow(RangeError('MaxSessionsPolicy: maxSessions must be a positive integer'))
    })

    it('should throw a RangeError if maxSessions is NaN', () => {
      expect(() => new MaxSessionsPolicy(NaN)).toThrow(RangeError('MaxSessionsPolicy: maxSessions must be a positive integer'))
    })
  })

  describe('sessionsToRevoke', () => {
    const userSessionBuilder = new UserSessionTestBuilder()
    const date1 = new Date('2025-10-17T16:13:00Z')
    const date2 = new Date('2025-10-17T16:14:00Z')
    const date3 = new Date('2025-10-17T16:15:00Z')
    const date4 = new Date('2025-10-17T16:16:00Z')
    const date5 = new Date('2025-10-17T16:17:00Z')

    it('should return an empty array if active sessions are below the limit', () => {
      const policy = new MaxSessionsPolicy(5)
      const activeSessions = [
        userSessionBuilder.withCreatedAt(date1).build(),
        userSessionBuilder.withCreatedAt(date2).build(),
        userSessionBuilder.withCreatedAt(date3).build(),
      ]

      const result = policy.sessionsToRevoke(activeSessions)
      expect(result).toEqual([])
    })

    it('should return an empty array if active sessions are one less than the limit', () => {
      const policy = new MaxSessionsPolicy(5)
      const activeSessions = [
        userSessionBuilder.withCreatedAt(date1).build(),
        userSessionBuilder.withCreatedAt(date2).build(),
        userSessionBuilder.withCreatedAt(date3).build(),
        userSessionBuilder.withCreatedAt(date4).build(),
      ]

      const result = policy.sessionsToRevoke(activeSessions)
      expect(result).toEqual([])
    })

    it('should return the single oldest session when the limit is reached', () => {
      const policy = new MaxSessionsPolicy(5)
      const oldestSession = userSessionBuilder.withCreatedAt(date1).build()
      const activeSessions = [
        oldestSession,
        userSessionBuilder.withCreatedAt(date2).build(),
        userSessionBuilder.withCreatedAt(date3).build(),
        userSessionBuilder.withCreatedAt(date4).build(),
        userSessionBuilder.withCreatedAt(date5).build(),
      ]

      const result = policy.sessionsToRevoke(activeSessions)
      expect(result.length).toBe(1)
      expect(result[0]).toBe(oldestSession)
    })

    it('should return the two oldest sessions when the limit is exceeded by two', () => {
      const policy = new MaxSessionsPolicy(3)
      const session1 = userSessionBuilder.withCreatedAt(date1).build()
      const session2 = userSessionBuilder.withCreatedAt(date2).build()
      const activeSessions = [
        session1,
        session2,
        userSessionBuilder.withCreatedAt(date3).build(),
        userSessionBuilder.withCreatedAt(date4).build(),
      ]

      const result = policy.sessionsToRevoke(activeSessions)
      expect(result.length).toBe(2)
      expect(result.map((session) => session.createdAt)).toEqual([date1, date2])
    })

    it('should correctly sort sessions and return the oldest, regardless of input order', () => {
      const policy = new MaxSessionsPolicy(3)
      const oldestSession = userSessionBuilder.withCreatedAt(date1).build()
      const newestSession = userSessionBuilder.withCreatedAt(date5).build()
      const middleSession1 = userSessionBuilder.withCreatedAt(date2).build()
      const middleSession2 = userSessionBuilder.withCreatedAt(date4).build()

      const activeSessions = [middleSession1, newestSession, oldestSession, middleSession2]

      const result = policy.sessionsToRevoke(activeSessions)

      expect(result.length).toBe(2)
      expect(result.map((session) => session.id)).toEqual([oldestSession.id, middleSession1.id])
    })

    it('should return an empty array for an empty list of sessions', () => {
      const policy = new MaxSessionsPolicy(5)
      const result = policy.sessionsToRevoke([])
      expect(result).toEqual([])
    })
  })
})
