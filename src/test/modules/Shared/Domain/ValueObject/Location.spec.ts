import { Location, LocationProps } from '~/src/modules/Shared/Domain/ValueObject/Location'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { LocationMother } from '~/src/test/mothers/Domain/Shared/LocationMother'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

class DummyVO extends ValueObject<LocationProps> {}

describe('Location', () => {
  describe('safeCreate', () => {
    it('should return success when latitude and longitude are valid', () => {
      const validLocations = Array.from({ length: 100 }, () => LocationMother.randomValues())

      validLocations.forEach((props) => {
        const result = Location.safeCreate(props)

        expect(result.success).toBe(true)

        const expectedLat = Number(props.lat.toFixed(8))
        const expectedLng = Number(props.lng.toFixed(8))

        expect(result['value'].lat).toBe(expectedLat)
        expect(result['value'].lng).toBe(expectedLng)
      })
    })

    it.each(LocationMother.INVALID_LATS)('should return fail when latitude is invalid: %s', (invalidLat) => {
      const props = { lat: invalidLat, lng: LocationMother.VALID_LNG }
      const result = Location.safeCreate(props)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidLocation(String(props.lat), String(props.lng)))
    })

    it.each(LocationMother.INVALID_LNGS)('should return fail when longitude is invalid: %s', (invalidLng) => {
      const props = { lat: LocationMother.VALID_LAT, lng: invalidLng }
      const result = Location.safeCreate(props)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidLocation(String(props.lat), String(props.lng)))
    })
  })

  describe('fromProps', () => {
    it('should not throw when latitude and longitude are valid', () => {
      const validLocations = Array.from({ length: 100 }, () => LocationMother.randomValues())

      validLocations.forEach((props) => {
        expect(() => Location.fromProps(props)).not.toThrow()
      })
    })

    it.each(LocationMother.INVALID_LATS)('should throw error when latitude is invalid: %s', (invalidLat) => {
      const props = { lat: invalidLat, lng: LocationMother.VALID_LNG }

      expect(() => Location.fromProps(props)).toThrow(SharedDomainException.invalidLocation(String(props.lat), String(props.lng)))
    })

    it.each(LocationMother.INVALID_LNGS)('should throw error when longitude is invalid: %s', (invalidLng) => {
      const props = { lat: LocationMother.VALID_LAT, lng: invalidLng }

      expect(() => Location.fromProps(props)).toThrow(SharedDomainException.invalidLocation(String(props.lat), String(props.lng)))
    })
  })

  describe('equals', () => {
    it('should return false when valueObjects values are equal but their types are different', () => {
      const validProps = LocationMother.validValues()

      const valueA = new DummyVO(validProps)
      const valueB = Location.fromProps(validProps)

      expect(valueA.equals(valueB)).toBe(false)
    })

    it('should return true when both locations represent the same coordinates', () => {
      const validProps = LocationMother.validValues()

      const location1 = Location.fromProps(validProps)
      const location2 = Location.fromProps(validProps)

      expect(location1.equals(location2)).toBe(true)
    })

    it('should return false when latitudes are different', () => {
      const validProps = LocationMother.validValues()
      const differentLatProps = { ...validProps, lat: validProps.lat + 1 }

      const location1 = Location.fromProps(validProps)
      const location2 = Location.fromProps(differentLatProps)

      expect(location1.equals(location2)).toBe(false)
    })

    it('should return false when longitudes are different', () => {
      const validProps = LocationMother.validValues()
      const differentLngProps = { ...validProps, lng: validProps.lng + 1 }

      const location1 = Location.fromProps(validProps)
      const location2 = Location.fromProps(differentLngProps)

      expect(location1.equals(location2)).toBe(false)
    })

    it('should return false when comparing with null or undefined', () => {
      const location = LocationMother.valid()

      expect(location.equals(null)).toBe(false)
      expect(location.equals(undefined)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return comma-separated latitude and longitude', () => {
      const location = LocationMother.valid()
      expect(location.toString()).toBe(`${LocationMother.VALID_LAT}, ${LocationMother.VALID_LNG}`)
    })
  })

  describe('toDTO', () => {
    it('should return correct DTO structure', () => {
      const location = LocationMother.valid()

      const dto = location.toDTO()

      expect(dto.lat).toBe(location.value.lat)
      expect(dto.lng).toBe(location.value.lng)
    })
  })

  it('should normalize latitude and longitude to 8 decimal correctly', () => {
    const rawProps = { lat: 40.41677543219876, lng: -3.70379012345678 }
    const location = Location.fromProps(rawProps)

    expect(location.value.lat).toBe(40.41677543)
    expect(location.value.lng).toBe(-3.70379012)
  })
})
