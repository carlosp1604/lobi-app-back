const { getPostgresTestContainer } = require('../postgres-testcontainer')
const path = require('path')
const { DataSource } = require('typeorm')

module.exports = async () => {
  const pg = await getPostgresTestContainer()

  globalThis.__PG_TESTCONTAINER__ = pg.container

  process.env.PGTEST_HOST = pg.host
  process.env.PGTEST_PORT = String(pg.port)
  process.env.PGTEST_DB = pg.db
  process.env.PGTEST_USER = pg.user
  process.env.PGTEST_PASS = pg.pass

  const dataSource = new DataSource({
    type: 'postgres',
    host: pg.host,
    port: pg.port,
    username: pg.user,
    password: pg.pass,
    database: pg.db,
    synchronize: false,
    migrationsRun: false,
    logging: false,
    migrations: [path.join(process.cwd(), 'src/db/migrations/*.{ts,js}')],
  })

  await dataSource.initialize()
  await dataSource.runMigrations()
  await dataSource.destroy()
}
