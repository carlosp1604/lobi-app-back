import { DatabaseConfigProvider } from './databaseConfigProvider'

let instance: DatabaseConfigProvider | null = null

export function getDatabaseConfig() {
  if (!instance) {
    instance = new DatabaseConfigProvider()
  }

  return instance
}
