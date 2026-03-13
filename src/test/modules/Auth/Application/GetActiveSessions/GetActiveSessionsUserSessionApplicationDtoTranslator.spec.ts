import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { GetActiveSessionsUserSessionApplicationDtoTranslator } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsUserSessionApplicationDtoTranslator'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { GetActiveSessionsUserSessionApplicationDto } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsApplicationResponseDto'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'

describe('GetActiveSessionsUserSessionApplicationDtoTranslator', () => {
  const now = new Date('2026-03-10T09:55:00.000Z')
  const expiresAt = new Date(now.getTime() + 1000 * 3600)

  const sessionId = IdentifierMother.valid()
  const userId = IdentifierMother.valid()
  const userAgent = UserAgentMother.forTesting()

  const buildSession = (location: DeviceLocation | null) => {
    return new UserSessionTestBuilder()
      .withId(sessionId)
      .withUserId(userId)
      .withDeviceLocation(location)
      .withUserAgent(userAgent)
      .withCreatedAt(now)
      .withExpiresAt(expiresAt)
      .build()
  }

  const assertResult = (result: GetActiveSessionsUserSessionApplicationDto, isCurrent: boolean, location: DeviceLocation | null) => {
    expect(result.id).toEqual(sessionId.value)
    expect(result.userAgent).toEqual(userAgent.value)
    expect(result.activeSince).toEqual(now)
    expect(result.expiresAt).toEqual(expiresAt)
    expect(result.isCurrent).toEqual(isCurrent)

    if (location) {
      expect(result.deviceCity).toEqual(location.city)
      expect(result.deviceCountryCode).toEqual(location.countryCode)
    } else {
      expect(result.deviceCity).toBeNull()
      expect(result.deviceCountryCode).toBeNull()
    }
  }

  it('should translate domain entity to DTO correctly when location exists', () => {
    const location = DeviceLocationMother.valid()

    const session = buildSession(location)

    const result = GetActiveSessionsUserSessionApplicationDtoTranslator.fromDomain(session, sessionId)

    assertResult(result, true, location)
  })

  it('should translate domain entity to DTO correctly when location is null', () => {
    const session = buildSession(null)

    const result = GetActiveSessionsUserSessionApplicationDtoTranslator.fromDomain(session, sessionId)

    assertResult(result, true, null)
  })

  it('should set isCurrent to false when session ID does not match currentSessionId', () => {
    const otherSessionId = IdentifierMother.valid()
    const session = buildSession(null)

    const result = GetActiveSessionsUserSessionApplicationDtoTranslator.fromDomain(session, otherSessionId)

    assertResult(result, false, null)
  })
})
