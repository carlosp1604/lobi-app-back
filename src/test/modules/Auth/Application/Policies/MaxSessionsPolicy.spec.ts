import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'

describe('MaxSessionsPolicy', () => {
  it('should return the correct maxSessions value', () => {
    const maxSessionsPolicy = new MaxSessionsPolicy({ maxActive: 5 })

    const value = maxSessionsPolicy.maxSessions

    expect(value).toBe(5)
  })
})
