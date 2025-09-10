import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { startPostgresContainer } from './utils/postgres-testcontainer'
import { MockLoggerService } from '~/src/test/mocks/MockLoggerService'

describe('App (integration)', () => {
  let app: INestApplication
  let dataSource: DataSource
  let stop: () => Promise<void>

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
          entities: [__dirname + '/../src/**/*.entity.{ts,js}'],
          migrations: [__dirname + '/../src/migrations/*.{ts,js}'],
        }),
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    dataSource = app.get(DataSource)
    app.useLogger(new MockLoggerService())
    await app.init()
  })

  afterAll(async () => {
    await app.close()
    if (stop) {
      await stop()
    }
  })

  it('smoke: app y db are alive', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await dataSource.query('SELECT 1 as ok;')
    expect(result[0].ok).toBe(1)
  })
})
