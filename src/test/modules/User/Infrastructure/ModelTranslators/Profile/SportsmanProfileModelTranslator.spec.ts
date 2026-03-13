import { makeRawSportsmanProfile } from '~/src/test/modules/User/Infrastructure/Profile/SportsmanProfileRawTestMaker'
import { SportsmanProfileBioMother } from '~/src/test/mothers/SportsmanProfileBioMother'
import { SportsmanProfileBirthDateMother } from '~/src/test/mothers/SportsmanProfileBirthDateMother'
import { SportsmanProfile } from '~/src/modules/User/Domain/Profile/SportsmanProfile'
import { SportsmanProfileRawModel } from '~/src/modules/User/Infrastructure/Entities/Profiles/sportsman-profile.entity'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { SportsmanProfileBio } from '~/src/modules/User/Domain/ValueObject/Profile/SportsmanProfileBio'
import { SportsmanProfileBirthDate } from '~/src/modules/User/Domain/ValueObject/Profile/SportsmanProfileBirthDate'
import { SportsmanProfileModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/Profile/SportsmanProfileModelTranslator'
import { ProfileDomainException } from '~/src/modules/User/Domain/Profile/ProfileDomainException'
import { SportsmanProfileTestBuilder } from '~/src/test/modules/User/Domain/Profile/SportsmanProfileTestBuilder'

describe('SportsmanProfileModelTranslator', () => {
  const isoDate = '2026-02-14T19:05:00.000Z'
  const now = new Date(isoDate)

  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(now)
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  const baseRaw = makeRawSportsmanProfile({
    bio: SportsmanProfileBioMother.valid().value,
    birth_date: SportsmanProfileBirthDateMother.valid(now).toISODate(),
    created_at: now,
    updated_at: now,
  })

  describe('toDomain', () => {
    const checkResult = (result: SportsmanProfile, raw: SportsmanProfileRawModel) => {
      expect(result.id).toBeInstanceOf(Identifier)
      expect(result.userId).toBeInstanceOf(Identifier)

      expect(result.id.value).toBe(raw.id)
      expect(result.userId.value).toBe(raw.user_id)

      if (raw.bio === null) {
        expect(result.bio).toBeNull()
      } else {
        expect(result.bio).toBeInstanceOf(SportsmanProfileBio)
        expect(result.bio?.value).toBe(raw.bio)
      }

      if (raw.birth_date === null) {
        expect(result.birthDate).toBeNull()
      } else {
        expect(result.birthDate).toBeInstanceOf(SportsmanProfileBirthDate)
        expect(result.birthDate?.toISODate()).toBe(raw.birth_date)
      }

      expect(result.createdAt).toEqual(raw.created_at)
      expect(result.updatedAt).toEqual(raw.updated_at)
    }

    it('should return domain object when nullable fields are not NULL', () => {
      const raw = { ...baseRaw }

      const result = SportsmanProfileModelTranslator.toDomain(raw, now)

      checkResult(result, raw)
      expect(result.bio).not.toBeNull()
      expect(result.birthDate).not.toBeNull()
    })

    it('should return the correct domain object when nullable fields are NULL', () => {
      const raw = { ...baseRaw, bio: null, birth_date: null }

      const result = SportsmanProfileModelTranslator.toDomain(raw, now)

      checkResult(result, raw)
      expect(result.bio).toBeNull()
      expect(result.birthDate).toBeNull()
    })

    it('should propagate errors from ValueObject', () => {
      const invalidBio = SportsmanProfileBioMother.invalid()
      const rawInvalidBio = { ...baseRaw, bio: invalidBio }

      expect(() => SportsmanProfileModelTranslator.toDomain(rawInvalidBio, now)).toThrow(
        ProfileDomainException.invalidSportsmanBio(invalidBio),
      )
    })

    it('does not mutate the input raw model', () => {
      const raw = structuredClone(baseRaw)

      SportsmanProfileModelTranslator.toDomain(raw, now)

      expect(raw).toEqual(baseRaw)
    })
  })

  describe('toDatabase', () => {
    let builder: SportsmanProfileTestBuilder

    const checkResult = (result: SportsmanProfileRawModel, domain: SportsmanProfile) => {
      expect(result.id).toBe(domain.id.value)
      expect(result.user_id).toBe(domain.userId.value)

      if (domain.bio === null) {
        expect(result.bio).toBeNull()
      } else {
        expect(result.bio).toBe(domain.bio.value)
      }

      if (domain.birthDate === null) {
        expect(result.birth_date).toBeNull()
      } else {
        expect(result.birth_date).toBe(domain.birthDate.toISODate())
      }

      expect(result.created_at).toEqual(domain.createdAt)
      expect(result.updated_at).toEqual(domain.updatedAt)
    }

    beforeEach(() => {
      builder = new SportsmanProfileTestBuilder()
        .withId(IdentifierMother.valid())
        .withUserId(IdentifierMother.valid())
        .withBio(SportsmanProfileBioMother.valid())
        .withBirthDate(SportsmanProfileBirthDateMother.valid(now))
        .withCreatedAt(now)
        .withUpdatedAt(now)
    })

    it('should return the correct raw model when nullable fields are not NULL', () => {
      const domain = builder.build()

      const result = SportsmanProfileModelTranslator.toDatabase(domain)

      checkResult(result, domain)
      expect(result.bio).not.toBeNull()
      expect(result.birth_date).not.toBeNull()
    })

    it('should return the correct raw model when nullable fields are NULL', () => {
      const domain = builder.withBio(null).withBirthDate(null).build()

      const result = SportsmanProfileModelTranslator.toDatabase(domain)

      checkResult(result, domain)
      expect(result.bio).toBeNull()
      expect(result.birth_date).toBeNull()
    })

    it('does not mutate the input domain object', () => {
      const domain = builder.build()

      const snapshot = {
        id: domain.id,
        userId: domain.userId,
        bio: domain.bio,
        birthDate: domain.birthDate,
        createdAt: domain.createdAt,
        updatedAt: domain.updatedAt,
      }

      SportsmanProfileModelTranslator.toDatabase(domain)

      expect(domain.id.equals(snapshot.id)).toBe(true)
      expect(domain.userId.equals(snapshot.userId)).toBe(true)
      expect(domain.bio?.equals(snapshot.bio)).toBe(true)
      expect(domain.birthDate?.equals(snapshot.birthDate)).toBe(true)
      expect(domain.createdAt).toEqual(snapshot.createdAt)
      expect(domain.updatedAt).toEqual(snapshot.updatedAt)
    })
  })
})
