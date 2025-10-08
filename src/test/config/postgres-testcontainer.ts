import { StartedPostgreSqlContainer, PostgreSqlContainer } from '@testcontainers/postgresql'

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
    .withDatabase('testdb')
    .withUsername('test')
    .withPassword('test')
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
