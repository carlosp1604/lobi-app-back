import 'reflect-metadata'
import { DataSource, QueryRunner } from 'typeorm'
import { startPostgresContainer } from '~/src/test/utils/postgres-testcontainer'
import { Test } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { INestApplication } from '@nestjs/common'
import { UserCredentialEntity } from '~/src/modules/Auth/Infrastructure/Entities/UserCredential.entity'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserEntity, UserRawModel } from '~/src/modules/User/Infrastructure/Entities/User.entity'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserUploadIdMother } from '~/src/test/mothers/UserUploadIdMother'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { UserSessionEntity } from '~/src/modules/Auth/Infrastructure/Entities/UserSession.entity'
import { User } from '~/src/modules/User/Domain/User'

describe('PostgresqlUserRepository', () => {
  let app: INestApplication
  let dataSource: DataSource
  let stop: () => Promise<void>

  const userId = UserIdMother.valid()
  const userEmail = UserEmailMother.valid()
  const now = new Date('2025-09-26T14:11:25Z')

  const baseRawUser: UserRawModel = {
    id: userId.toString(),
    email: userEmail.toString(),
    username: UserUsernameMother.valid().toString(),
    name: UserNameMother.valid().toString(),
    status: UserStatus.active().toString(),
    role: UserRole.sportsman().toString(),
    user_upload_id: UserUploadIdMother.valid().toString(),
    email_verified_at: now,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }

  const rawCredential = {
    user_id: userId.toString(),
    password_hash: PasswordHashMother.valid().toString(),
    failed_attempts: 0,
    locked_until: null,
    last_login_at: null,
    created_at: now,
    updated_at: now,
  }

  beforeAll(async () => {
    const pg = await startPostgresContainer()

    stop = async () => {
      await pg.container.stop()
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: pg.host,
          port: pg.port,
          username: pg.user,
          password: pg.pass,
          database: pg.db,
          synchronize: false,
          migrationsRun: true,
          logging: false,
          entities: [UserEntity, UserCredentialEntity, UserSessionEntity],
          migrations: ['./src/db/migrations/*.{ts,js}'],
        }),
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    dataSource = app.get(DataSource)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
    if (stop) {
      await stop()
    }
  })

  let runner: QueryRunner

  beforeEach(async () => {
    runner = dataSource.createQueryRunner()
    await runner.connect()
    await runner.startTransaction()
  })

  afterEach(async () => {
    try {
      await runner.rollbackTransaction()
    } finally {
      await runner.release()
    }
  })

  const checkUserFound = (result: User | null) => {
    expect(result).toBeTruthy()
    expect(result?.id.toString()).toBe(userId.toString())
    expect(() => result?.credential).not.toThrow()
  }

  it('should find user with credential and translate to domain correctly', async () => {
    const userRepository = runner.manager.getRepository(UserEntity)
    await userRepository.save(baseRawUser)

    const credentialRepository = runner.manager.getRepository(UserCredentialEntity)
    await credentialRepository.save(rawCredential)

    const repo = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

    const result = await repo.findByEmailWithCredentials(userEmail.toString())

    checkUserFound(result)
    expect(result?.credential?.userId.toString()).toBe(userId.toString())
  })

  it('should find user without credential and translate to domain correctly', async () => {
    const userRepository = runner.manager.getRepository(UserEntity)
    await userRepository.save(baseRawUser)

    const repo = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

    const result = await repo.findByEmailWithCredentials(userEmail.toString())

    checkUserFound(result)
    expect(result?.credential).toBeNull()
  })

  it('should return null if user does not exist', async () => {
    const repo = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

    const result = await repo.findByEmailWithCredentials(userEmail.toString())

    expect(result).toBeNull()
  })
})
