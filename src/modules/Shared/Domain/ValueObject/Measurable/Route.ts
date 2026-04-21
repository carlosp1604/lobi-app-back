import { Location } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Result, fail, success } from '~/src/modules/Shared/Domain/Result'
import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/Visitor/MeasurableValueVisitorInterface'
import { VisitableMeasurableValueInterface } from '~/src/modules/Shared/Domain/Visitor/VisitableMeasurableValueInterface'

export type RouteProps = {
  points: Array<Location>
  isPublic: boolean
}

export type RouteInputProps = {
  points: Array<Location>
  isPublic?: boolean
}

export class Route extends ValueObject<RouteProps> implements VisitableMeasurableValueInterface {
  private __routeBrand: void

  public static readonly MIN_POINTS = 2
  public static readonly MAX_POINTS = 1000

  private constructor(props: RouteProps) {
    super(props)
  }

  public static safeCreate(props: RouteInputProps): Result<Route, SharedDomainException> {
    if (props.points.length < this.MIN_POINTS || props.points.length > this.MAX_POINTS) {
      return fail(SharedDomainException.invalidRoute(this.MIN_POINTS, this.MAX_POINTS))
    }

    const isPublic = props.isPublic ?? false

    return success(new Route({ points: props.points, isPublic }))
  }

  public static fromProps(props: RouteInputProps): Route {
    const routeResult = this.safeCreate(props)

    if (!routeResult.success) {
      throw routeResult.error
    }

    return routeResult.value
  }

  public equals(vo?: Route | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    if (this._value.isPublic !== vo._value.isPublic) {
      return false
    }

    if (this._value.points.length !== vo._value.points.length) {
      return false
    }

    return this._value.points.every((point, index) => point.equals(vo.points[index]))
  }

  public toString(): string {
    const total = this._value.points.length
    const start = this._value.points[0].toString()
    const end = this._value.points[total - 1].toString()

    return `${this._value.isPublic ? 'Public' : 'Private'} Route: [${total} points] From (${start}) To (${end})`
  }

  public accept<R>(visitor: MeasurableValueVisitorInterface<R>): R {
    return visitor.visitRoute(this)
  }

  public get points(): Array<Location> {
    return this._value.points
  }

  public get isPublic(): boolean {
    return this._value.isPublic
  }
}
