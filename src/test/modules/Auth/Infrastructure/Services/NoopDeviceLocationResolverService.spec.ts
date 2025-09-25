import { NoopDeviceLocationResolverService } from '~/src/modules/Auth/Infrastructure/Services/NoopDeviceLocationResolverService'

// TODO: Implement
describe('NoopDeviceLocationResolverService', () => {
  it('should return null when is called', async () => {
    const noopDeviceLocationResolverService = new NoopDeviceLocationResolverService()

    const result = await noopDeviceLocationResolverService.resolve('a-valid-ip')

    expect(result).toBeNull()
  })
})
