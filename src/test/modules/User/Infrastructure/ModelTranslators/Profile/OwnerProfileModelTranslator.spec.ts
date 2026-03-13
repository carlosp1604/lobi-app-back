import { OwnerProfileTestBuilder } from '~/src/test/modules/User/Domain/Profile/OwnerProfileTestBuilder'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { OwnerProfileCompanyNameMother } from '~/src/test/mothers/OwnerProfileCompanyNameMother'
import { OwnerProfileTaxIdMother } from '~/src/test/mothers/OwnerProfileTaxIdMother'
import { OwnerProfileContactPhoneMother } from '~/src/test/mothers/OwnerProfileContactPhoneMother'
import { OwnerProfile } from '~/src/modules/User/Domain/Profile/OwnerProfile'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ProfileDomainException } from '~/src/modules/User/Domain/Profile/ProfileDomainException'
import { makeRawOwnerProfile } from '~/src/test/modules/User/Infrastructure/Profile/OwnerProfileRawTestMaker'
import { OwnerProfileRawModel } from '~/src/modules/User/Infrastructure/Entities/Profiles/owner-profile.entity'
import { OwnerProfileCompanyName } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileCompanyName'
import { OwnerProfileTaxId } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileTaxId'
import { OwnerProfileContactPhone } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileContactPhone'
import { OwnerProfileModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/Profile/OwnerProfileModelTranslator'

describe('OwnerProfileModelTranslator', () => {
  const isoDate = '2025-09-16T09:14:34.000Z'
  const now = new Date(isoDate)

  const baseRaw = makeRawOwnerProfile({
    company_name: OwnerProfileCompanyNameMother.valid().value,
    tax_id: OwnerProfileTaxIdMother.valid().value,
    contact_phone: OwnerProfileContactPhoneMother.valid().value,
    created_at: now,
    updated_at: now,
  })

  describe('toDomain', () => {
    const checkResult = (result: OwnerProfile, raw: OwnerProfileRawModel) => {
      expect(result.id).toBeInstanceOf(Identifier)
      expect(result.userId).toBeInstanceOf(Identifier)

      expect(result.id.value).toBe(raw.id)
      expect(result.userId.value).toBe(raw.user_id)

      if (raw.company_name === null) {
        expect(result.companyName).toBeNull()
      } else {
        expect(result.companyName).toBeInstanceOf(OwnerProfileCompanyName)
        expect(result.companyName?.value).toBe(raw.company_name)
      }

      if (raw.tax_id === null) {
        expect(result.taxId).toBeNull()
      } else {
        expect(result.taxId).toBeInstanceOf(OwnerProfileTaxId)
        expect(result.taxId?.value).toBe(raw.tax_id)
      }

      if (raw.contact_phone === null) {
        expect(result.contactPhone).toBeNull()
      } else {
        expect(result.contactPhone).toBeInstanceOf(OwnerProfileContactPhone)
        expect(result.contactPhone?.value).toBe(raw.contact_phone)
      }

      expect(result.createdAt).toEqual(raw.created_at)
      expect(result.updatedAt).toEqual(raw.updated_at)
    }

    it('should return domain object when nullable fields are not NULL', () => {
      const raw = { ...baseRaw }

      const result = OwnerProfileModelTranslator.toDomain(raw)

      checkResult(result, raw)
      expect(result.companyName).not.toBeNull()
      expect(result.taxId).not.toBeNull()
      expect(result.contactPhone).not.toBeNull()
    })

    it('should return the correct domain object when nullable fields are NULL', () => {
      const raw = { ...baseRaw, company_name: null, tax_id: null, contact_phone: null }

      const result = OwnerProfileModelTranslator.toDomain(raw)

      checkResult(result, raw)
      expect(result.companyName).toBeNull()
      expect(result.taxId).toBeNull()
      expect(result.contactPhone).toBeNull()
    })

    it('should propagate errors from ValueObject', () => {
      const invalidOwnerPhoneContact = OwnerProfileContactPhoneMother.invalid()
      const rawInvalidPhone = { ...baseRaw, contact_phone: invalidOwnerPhoneContact }

      expect(() => OwnerProfileModelTranslator.toDomain(rawInvalidPhone)).toThrow(
        ProfileDomainException.invalidOwnerContactPhone(invalidOwnerPhoneContact),
      )
    })

    it('does not mutate the input raw model', () => {
      const raw = structuredClone(baseRaw)

      OwnerProfileModelTranslator.toDomain(raw)

      expect(raw).toEqual(baseRaw)
    })
  })

  describe('toDatabase', () => {
    let builder: OwnerProfileTestBuilder

    const checkResult = (result: OwnerProfileRawModel, domain: OwnerProfile) => {
      expect(result.id).toBe(domain.id.value)
      expect(result.user_id).toBe(domain.userId.value)

      if (domain.companyName === null) {
        expect(result.company_name).toBeNull()
      } else {
        expect(result.company_name).toBe(domain.companyName.value)
      }

      if (domain.taxId === null) {
        expect(result.tax_id).toBeNull()
      } else {
        expect(result.tax_id).toBe(domain.taxId.value)
      }

      if (domain.contactPhone === null) {
        expect(result.contact_phone).toBeNull()
      } else {
        expect(result.contact_phone).toBe(domain.contactPhone.value)
      }

      expect(result.created_at).toEqual(domain.createdAt)
      expect(result.updated_at).toEqual(domain.updatedAt)
    }

    beforeEach(() => {
      builder = new OwnerProfileTestBuilder()
        .withId(IdentifierMother.valid())
        .withUserId(IdentifierMother.valid())
        .withCompanyName(OwnerProfileCompanyNameMother.valid())
        .withTaxId(OwnerProfileTaxIdMother.valid())
        .withContactPhone(OwnerProfileContactPhoneMother.valid())
        .withCreatedAt(now)
        .withUpdatedAt(now)
    })

    it('should return the correct raw model when nullable fields are not NULL', () => {
      const domain = builder.build()

      const result = OwnerProfileModelTranslator.toDatabase(domain)

      checkResult(result, domain)
      expect(result.company_name).not.toBeNull()
      expect(result.tax_id).not.toBeNull()
      expect(result.contact_phone).not.toBeNull()
    })

    it('should return the correct raw model when nullable fields are NULL', () => {
      const domain = builder.withCompanyName(null).withTaxId(null).withContactPhone(null).build()

      const result = OwnerProfileModelTranslator.toDatabase(domain)

      checkResult(result, domain)
      expect(result.company_name).toBeNull()
      expect(result.tax_id).toBeNull()
      expect(result.contact_phone).toBeNull()
    })

    it('does not mutate the input domain object', () => {
      const domain = builder.build()

      const snapshot = {
        id: domain.id,
        userId: domain.userId,
        companyName: domain.companyName,
        taxId: domain.taxId,
        contactPhone: domain.contactPhone,
        createdAt: domain.createdAt,
        updatedAt: domain.updatedAt,
      }

      OwnerProfileModelTranslator.toDatabase(domain)

      expect(domain.id.equals(snapshot.id)).toBe(true)
      expect(domain.userId.equals(snapshot.userId)).toBe(true)
      expect(domain.companyName?.equals(snapshot.companyName)).toBe(true)
      expect(domain.taxId?.equals(snapshot.taxId)).toBe(true)
      expect(domain.contactPhone?.equals(snapshot.contactPhone)).toBe(true)
      expect(domain.createdAt).toEqual(snapshot.createdAt)
      expect(domain.updatedAt).toEqual(snapshot.updatedAt)
    })
  })
})
