import fc from 'fast-check'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { DeviceLocation, DeviceLocationProps } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'

class TestLocation extends ValueObject<{ city: string; countryCode: string }> {
  constructor(props: { city: string; countryCode: string }) {
    super(props)
  }

  get city(): string {
    return this.value.city
  }

  get countryCode(): string {
    return this.value.countryCode
  }
}

const invalidCityCases: Array<DeviceLocationProps> = [
  { city: '', countryCode: 'ES' },
  { city: '   ', countryCode: 'ES' },
]

const invalidCountryCodeCases: Array<DeviceLocationProps> = [
  { city: 'Madrid', countryCode: '' },
  { city: 'Madrid', countryCode: '   ' },
  { city: 'Madrid', countryCode: 'E' },
  { city: 'Madrid', countryCode: 'ESP' },
  { city: 'Madrid', countryCode: 'E1' },
  { city: 'Madrid', countryCode: '1E' },
  { city: 'Madrid', countryCode: 'Z*' },
  { city: 'Madrid', countryCode: '-*' },
]

describe('DeviceLocation', () => {
  it('should not throw error when device location is valid', () => {
    const cityGen = fc
      .string({ minLength: 1, maxLength: 50 })
      .filter((s) => s.trim() !== '')
      .map((s) => ` ${s} `)

    const countryCodeGen = fc.stringMatching(/^[A-Z]{2}$/).map((s) => ` ${s} `)

    fc.assert(
      fc.property(cityGen, countryCodeGen, (city, countryCode) => {
        expect(() => DeviceLocation.fromProps({ city, countryCode })).not.toThrow()
      }),
    )
  })

  it.each(invalidCityCases)('should throw error when device location city si not valid: %s', (props) => {
    const expectedError = UserSessionDomainException.invalidDeviceCity(props.city.trim())
    expect(() => DeviceLocation.fromProps(props)).toThrow(expectedError)
  })

  it.each(invalidCountryCodeCases)('should throw error when device location countryCode is not valid: %s', (props) => {
    const expectedNormalizedCode = props.countryCode.trim().toUpperCase()
    const expectedError = UserSessionDomainException.invalidDeviceCountryCode(expectedNormalizedCode)
    expect(() => DeviceLocation.fromProps(props)).toThrow(expectedError)
  })

  it('should store the correct value', () => {
    const props: DeviceLocationProps = {
      city: '  Murcia  ',
      countryCode: '  es  ',
    }
    const location = DeviceLocation.fromProps(props)

    expect(location.city).toBe('Murcia')
    expect(location.countryCode).toBe('ES')

    expect(location.value).toEqual({
      city: 'Murcia',
      countryCode: 'ES',
    })
  })

  describe('equals', () => {
    it('should return true when valueObjects are equals', () => {
      const deviceLocation = DeviceLocationMother.valid()
      const sameDeviceLocation = DeviceLocationMother.valid()

      expect(deviceLocation.equals(sameDeviceLocation)).toBe(true)
    })

    it('returns false when valueObjects types are different', () => {
      const deviceLocation = DeviceLocationMother.valid()
      const anotherLocation = new TestLocation({ city: deviceLocation.city, countryCode: deviceLocation.countryCode })

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(deviceLocation.equals(anotherLocation as any)).toBe(false)
    })

    it('should return false when compared with null', () => {
      const deviceLocation = DeviceLocationMother.valid()

      expect(deviceLocation.equals(null)).toBe(false)
    })

    it('should return false when compared with undefined', () => {
      const deviceLocation = DeviceLocationMother.valid()

      expect(deviceLocation.equals(undefined)).toBe(false)
    })

    it('should return false when compared with null are not equals due to different', () => {
      const deviceLocation = DeviceLocationMother.valid()
      const differentDeviceLocation = DeviceLocationMother.random()

      expect(deviceLocation.equals(differentDeviceLocation)).toBe(false)
    })
  })
})
