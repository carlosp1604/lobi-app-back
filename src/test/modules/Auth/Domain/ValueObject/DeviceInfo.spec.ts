import { DeviceInfo, DeviceInfoProps } from '~/src/modules/Auth/Domain/ValueObject/DeviceInfo'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { DeviceInfoMother } from '~/src/test/mothers/DeviceInfoMother'

class DummyVO extends ValueObject<DeviceInfoProps> {
  private constructor(value: DeviceInfoProps) {
    super(value)
  }

  static fromProps(props: DeviceInfoProps) {
    return new DummyVO(props)
  }
}

describe('DeviceInfo', () => {
  const validProps = DeviceInfoMother.valid().value

  describe('fromProps', () => {
    it('should create a valid DeviceInfo when props are valid', () => {
      const deviceInfoValueObject = DeviceInfo.fromProps(validProps)

      expect(deviceInfoValueObject.raw).toBe(validProps.raw)
      expect(deviceInfoValueObject.browser).toEqual(validProps.browser)
      expect(deviceInfoValueObject.os).toEqual(validProps.os)
      expect(deviceInfoValueObject.hardware).toEqual(validProps.hardware)
    })

    it('should return an unknown DeviceInfo when the raw string is empty', () => {
      const emptyProps: DeviceInfoProps = { ...validProps, raw: '   ' }
      const deviceInfoValueObject = DeviceInfo.fromProps(emptyProps)

      const unknownUa = DeviceInfo.unknown()

      expect(deviceInfoValueObject).toEqual(unknownUa)
    })

    it('should throw error when raw DeviceInfo is longer than 512 characters', () => {
      const tooLong = 'a'.repeat(513)
      const invalidProps: DeviceInfoProps = { ...validProps, raw: tooLong }

      expect(() => DeviceInfo.fromProps(invalidProps)).toThrow(UserSessionDomainException.invalidDeviceInfo(tooLong))
    })

    it('should throw error when raw DeviceInfo contains non-ASCII visible characters', () => {
      const invalidRaw = 'Mozilla/5.0 😊'
      const invalidProps: DeviceInfoProps = { ...validProps, raw: invalidRaw }

      expect(() => DeviceInfo.fromProps(invalidProps)).toThrow(UserSessionDomainException.invalidDeviceInfo(invalidRaw))
    })
  })

  describe('safeCreate', () => {
    it('should return success when props are valid', () => {
      const result = DeviceInfo.safeCreate(validProps)

      expect(result.success).toBe(true)
      expect(result['value'].raw).toBe(validProps.raw)
    })

    it('should return fail when raw DeviceInfo is longer than 512 characters', () => {
      const tooLong = 'a'.repeat(513)
      const invalidProps: DeviceInfoProps = { ...validProps, raw: tooLong }

      const result = DeviceInfo.safeCreate(invalidProps)

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(UserSessionDomainException.invalidDeviceInfo(tooLong))
    })

    it('should return fail when raw DeviceInfo contains invalid characters', () => {
      const invalidRaw = 'Mozilla/5.0 😊'
      const invalidProps: DeviceInfoProps = { ...validProps, raw: invalidRaw }

      const result = DeviceInfo.safeCreate(invalidProps)

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(UserSessionDomainException.invalidDeviceInfo(invalidRaw))
    })
  })

  describe('equals', () => {
    it('returns false when valueObjects values are equal but their types are different', () => {
      const valueA = DummyVO.fromProps(validProps)
      const valueB = DeviceInfo.fromProps(validProps)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(valueB.equals(valueA)).toBe(false)
    })

    it('should return true when two DeviceInfo have the same raw string', () => {
      const deviceInfoValueObject1 = DeviceInfo.fromProps(validProps)
      const deviceInfoValueObject2 = DeviceInfo.fromProps({ ...validProps, browser: { name: 'Different', version: '1.0' } })

      expect(deviceInfoValueObject1.equals(deviceInfoValueObject2)).toBe(true)
    })

    it('should return false when compared to null or undefined', () => {
      const deviceInfoValueObject = DeviceInfo.fromProps(validProps)

      expect(deviceInfoValueObject.equals(null)).toBe(false)
      expect(deviceInfoValueObject.equals(undefined)).toBe(false)
    })
  })
})
