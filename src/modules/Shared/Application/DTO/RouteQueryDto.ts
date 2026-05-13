import { LocationQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'

export interface RouteQueryDto {
  readonly type: 'collection'
  readonly points: Array<LocationQueryDto>
}
