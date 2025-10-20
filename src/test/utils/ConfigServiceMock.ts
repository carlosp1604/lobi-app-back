import { jest } from '@jest/globals'

type ConfigMap<T> = Record<string, T>

export function createConfigServiceMockImplementation<T>(configMap: ConfigMap<T>): jest.Mock<(key: string) => T | null> {
  return jest.fn((key: string): T | null => {
    if (key in configMap) {
      return configMap[key]
    }
    return null
  })
}
