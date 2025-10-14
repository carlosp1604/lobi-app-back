const { getPostgresTestContainer } = require('../postgres-testcontainer')
const { env } = require('../../../modules/Shared/Infrastructure/env.loader')

module.exports = async () => {
  let databaseHost
  let databasePort
  let databaseDb
  let databaseUser
  let databasePass

  if (!process.env.CI) {
    const pg = await getPostgresTestContainer()

    globalThis.__PG_TESTCONTAINER__ = pg.container
    databaseHost = pg.host
    databaseDb = pg.db
    databaseUser = pg.user
    databasePass = pg.pass
    databasePort = String(pg.port)
  } else {
    if (!env.DATABASE_USER || !env.DATABASE_PORT || !env.DATABASE_NAME || !env.DATABASE_HOST || !env.DATABASE_PASSWORD) {
      throw new Error('DATABASE_* env vars not set')
    }

    globalThis.__PG_TESTCONTAINER__ = null
    databasePort = String(env.DATABASE_PORT)
    databaseDb = env.DATABASE_NAME
    databaseUser = env.DATABASE_USER
    databasePass = env.DATABASE_PASSWORD
    databaseHost = env.DATABASE_HOST
  }

  process.env.PGTEST_HOST = databaseHost
  process.env.PGTEST_PORT = databasePort
  process.env.PGTEST_DB = databaseDb
  process.env.PGTEST_USER = databaseUser
  process.env.PGTEST_PASS = databasePass
}
