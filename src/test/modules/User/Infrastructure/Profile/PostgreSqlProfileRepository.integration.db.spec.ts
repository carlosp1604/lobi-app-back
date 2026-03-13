import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { TypeOrmTxContext } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { QueryRunner } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { OwnerProfileTestBuilder } from '~/src/test/modules/User/Domain/Profile/OwnerProfileTestBuilder'
import { SportsmanProfileTestBuilder } from '~/src/test/modules/User/Domain/Profile/SportsmanProfileTestBuilder'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { OwnerProfileDatabaseHelper } from '~/src/test/modules/User/Infrastructure/Profile/OwnerProfileDatabaseHelper'
import { PostgreSqlProfileRepository } from '~/src/modules/User/Infrastructure/Profile/PostgreSqlProfileRepository'
import { mock, mockReset } from 'jest-mock-extended'
import { makeRawOwnerProfile } from '~/src/test/modules/User/Infrastructure/Profile/OwnerProfileRawTestMaker'
import { SportsmanProfileDatabaseHelper } from '~/src/test/modules/User/Infrastructure/Profile/SportsmanProfileDatabaseHelper'
import { makeRawSportsmanProfile } from '~/src/test/modules/User/Infrastructure/Profile/SportsmanProfileRawTestMaker'

describe('PostgreSqlProfileRepository', () => {
  const userId = IdentifierMother.valid()
  const profileId = IdentifierMother.valid()
  const userEmail = EmailAddressMother.valid()
  const now = new Date('2026-02-16T13:25:00Z')

  describe('saveOwnerProfile', () => {
    const mockedResolver = mock<TypeOrmManagerResolver>()

    let runner: QueryRunner
    let userDatabaseHelper: UserDatabaseHelper
    let ownerProfileDatabaseHelper: OwnerProfileDatabaseHelper
    let ownerProfileTestBuilder: OwnerProfileTestBuilder

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    beforeEach(async () => {
      mockReset(mockedResolver)

      mockedResolver.resolve.mockReturnValue(runner.manager)

      userDatabaseHelper = new UserDatabaseHelper(runner.manager)
      ownerProfileDatabaseHelper = new OwnerProfileDatabaseHelper(runner.manager)

      ownerProfileTestBuilder = new OwnerProfileTestBuilder().withId(profileId).withUserId(userId).withCreatedAt(now).withUpdatedAt(now)

      const rawUser = makeRawUser({ id: userId.value, email: userEmail.value })
      await userDatabaseHelper.save(rawUser)
    })

    it('should save owner profile correctly', async () => {
      const repository = new PostgreSqlProfileRepository(mockedResolver)

      const ownerProfile = ownerProfileTestBuilder.build()
      const context = new TypeOrmTxContext(runner.manager)

      const ownerProfilesBefore = await ownerProfileDatabaseHelper.count()

      await repository.saveOwnerProfile(ownerProfile, context)

      const ownerProfilesAfter = await ownerProfileDatabaseHelper.count()

      const foundProfile = await ownerProfileDatabaseHelper.findById(profileId.value)

      expect(ownerProfilesBefore).toBe(0)
      expect(ownerProfilesAfter).toBe(1)

      expect(foundProfile).not.toBeNull()
      expect(foundProfile!.id).toBe(ownerProfile.id.value)
      expect(foundProfile!.user_id).toBe(ownerProfile.userId.value)
      expect(foundProfile!.company_name).toBe(ownerProfile.companyName?.value ?? null)
      expect(foundProfile!.tax_id).toBe(ownerProfile.taxId?.value ?? null)
      expect(foundProfile!.contact_phone).toBe(ownerProfile.contactPhone?.value ?? null)
      expect(foundProfile!.created_at).toEqual(ownerProfile.createdAt)
      expect(foundProfile!.updated_at).toEqual(ownerProfile.updatedAt)
    })

    it('should throw error when owner profile already exists', async () => {
      const repository = new PostgreSqlProfileRepository(mockedResolver)

      const rawProfile = makeRawOwnerProfile({ id: profileId.value, user_id: userId.value })
      await ownerProfileDatabaseHelper.save(rawProfile)

      const duplicatedProfile = ownerProfileTestBuilder.build()
      const context = new TypeOrmTxContext(runner.manager)

      const ownerProfilesBefore = await ownerProfileDatabaseHelper.count()
      expect(ownerProfilesBefore).toBe(1)

      await expect(repository.saveOwnerProfile(duplicatedProfile, context)).rejects.toThrow()
    })
  })

  describe('saveSportsmanProfile', () => {
    const mockedResolver = mock<TypeOrmManagerResolver>()

    let runner: QueryRunner
    let userDatabaseHelper: UserDatabaseHelper
    let sportsmanProfileDatabaseHelper: SportsmanProfileDatabaseHelper
    let sportsmanProfileTestBuilder: SportsmanProfileTestBuilder

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    beforeEach(async () => {
      mockReset(mockedResolver)

      mockedResolver.resolve.mockReturnValue(runner.manager)
      userDatabaseHelper = new UserDatabaseHelper(runner.manager)
      sportsmanProfileDatabaseHelper = new SportsmanProfileDatabaseHelper(runner.manager)

      sportsmanProfileTestBuilder = new SportsmanProfileTestBuilder()
        .withId(profileId)
        .withUserId(userId)
        .withCreatedAt(now)
        .withUpdatedAt(now)

      const rawUser = makeRawUser({ id: userId.value, email: userEmail.value })
      await userDatabaseHelper.save(rawUser)
    })

    it('should save sportsman profile correctly', async () => {
      const repository = new PostgreSqlProfileRepository(mockedResolver)

      const sportsmanProfile = sportsmanProfileTestBuilder.build()
      const context = new TypeOrmTxContext(runner.manager)

      const sportsmanProfilesBefore = await sportsmanProfileDatabaseHelper.count()

      await repository.saveSportsmanProfile(sportsmanProfile, context)

      const sportsmanProfilesAfter = await sportsmanProfileDatabaseHelper.count()

      const foundProfile = await sportsmanProfileDatabaseHelper.findById(profileId.value)

      expect(sportsmanProfilesBefore).toBe(0)
      expect(sportsmanProfilesAfter).toBe(1)

      expect(foundProfile).not.toBeNull()
      expect(foundProfile!.id).toBe(sportsmanProfile.id.value)
      expect(foundProfile!.user_id).toBe(sportsmanProfile.userId.value)
      expect(foundProfile!.bio).toBe(sportsmanProfile.bio?.value ?? null)
      expect(foundProfile!.birth_date).toBe(sportsmanProfile.birthDate?.toISODate() ?? null)
      expect(foundProfile!.created_at).toEqual(sportsmanProfile.createdAt)
      expect(foundProfile!.updated_at).toEqual(sportsmanProfile.updatedAt)
    })

    it('should throw error when sportsman profile already exists', async () => {
      const repository = new PostgreSqlProfileRepository(mockedResolver)

      const rawProfile = makeRawSportsmanProfile({ id: profileId.value, user_id: userId.value })
      await sportsmanProfileDatabaseHelper.save(rawProfile)

      const duplicatedProfile = sportsmanProfileTestBuilder.build()
      const context = new TypeOrmTxContext(runner.manager)

      const sportsmanProfilesBefore = await sportsmanProfileDatabaseHelper.count()
      expect(sportsmanProfilesBefore).toBe(1)

      await expect(repository.saveSportsmanProfile(duplicatedProfile, context)).rejects.toThrow()
    })
  })
})
