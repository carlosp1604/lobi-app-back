import { StartedPostgreSqlContainer, PostgreSqlContainer } from '@testcontainers/postgresql'
// eslint-disable-next-line no-restricted-imports
import { env } from '../../modules/Shared/Infrastructure/env.loader'

export interface PostgresContainerConfig {
  host: string
  port: number
  db: string
  user: string
  pass: string
  container: StartedPostgreSqlContainer
}

let instance: PostgresContainerConfig | null = null

export async function getPostgresTestContainer(): Promise<PostgresContainerConfig> {
  if (instance) {
    return instance
  }

  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase(env.CONTAINER_DB)
    .withUsername(env.CONTAINER_USER)
    .withPassword(env.CONTAINER_PASSWORD)
    .start()

  instance = {
    host: container.getHost(),
    port: container.getPort(),
    db: container.getDatabase(),
    user: container.getUsername(),
    pass: container.getPassword(),
    container,
  }

  return instance
}
