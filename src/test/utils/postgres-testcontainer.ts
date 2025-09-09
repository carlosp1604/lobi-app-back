import { StartedPostgreSqlContainer, PostgreSqlContainer } from '@testcontainers/postgresql'

export async function startPostgresContainer() {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('testdb')
    .withUsername('test')
    .withPassword('test')
    .start()

  const containerConfiguration = {
    host: container.getHost(),
    port: container.getPort(),
    db: container.getDatabase(),
    user: container.getUsername(),
    pass: container.getPassword(),
    container,
  }

  return containerConfiguration as {
    host: string
    port: number
    db: string
    user: string
    pass: string
    container: StartedPostgreSqlContainer
  }
}
