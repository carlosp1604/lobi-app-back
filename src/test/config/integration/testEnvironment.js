const { Test } = require('@nestjs/testing')
const { TypeOrmModule } = require('@nestjs/typeorm')
const { DataSource } = require('typeorm')
const { UserEntity } = require('../../../modules/User/Infrastructure/Entities/user.entity')
const { UserSessionEntity } = require('../../../modules/Auth/Infrastructure/Entities/user-session.entity')
const { UserCredentialEntity } = require('../../../modules/Auth/Infrastructure/Entities/user-credential.entity')
const { DomainEventEntity } = require('../../../modules/Shared/Infrastructure/Entities/domain-event.entity')
const path = require('path')
const NodeEnvironment = require('jest-environment-node').TestEnvironment

class TestEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context)
  }

  async setup() {
    await super.setup()

    let app
    let dataSource

    const host = process.env.PGTEST_HOST
    const port = Number(process.env.PGTEST_PORT)
    const db = process.env.PGTEST_DB
    const user = process.env.PGTEST_USER
    const pass = process.env.PGTEST_PASS

    if (!host || !port || !db || !user || !pass) {
      throw new Error('PGTEST_* env vars not set — did globalSetup run?')
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host,
          port,
          username: user,
          password: pass,
          database: db,
          synchronize: false,
          migrationsRun: false,
          logging: false,
          entities: [UserEntity, UserSessionEntity, UserCredentialEntity, DomainEventEntity],
          migrations: [path.join(process.cwd(), 'dist/db/migrations/*.js')],
        }),
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
    dataSource = app.get(DataSource)

    if (!dataSource.isInitialized) {
      await dataSource.initialize()
    }

    await dataSource.dropDatabase()
    await dataSource.runMigrations()

    this.global.nestApp = app
    this.global.dataSource = dataSource
  }

  async teardown() {
    const app = this.global.nestApp

    if (app) {
      await app.close()
    }

    this.global.nestApp = null
    this.global.dataSource = null

    await super.teardown()
  }
}

module.exports = TestEnvironment
