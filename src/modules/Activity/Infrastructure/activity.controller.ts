import { GetSports } from '~/src/modules/Activity/Application/GetSports/GetSports'
import { AccessToken } from '~/src/modules/Auth/Infrastructure/Decorators/access-token.decorator'
import { CreateActivity } from '~/src/modules/Activity/Application/CreateActivity/CreateActivity'
import type { JwtPayload } from '~/src/modules/Auth/Infrastructure/jwt-payload.schema'
import { AccessTokenGuard } from '~/src/modules/Auth/Infrastructure/Guards/access-token.guard'
import { UNAUTHORIZED_ACCESS } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { CreateActivityBodyDto } from '~/src/modules/Activity/Infrastructure/Dtos/create-activity-body.dto'
import { CREATE_ACTIVITY, GET_SPORTS } from '~/src/modules/Activity/Infrastructure/activity.tokens'
import { CreateActivityApplicationError } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityApplicationError'
import { CreateActivityApplicationRequestDto } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityApplicationRequestDto'
import {
  ACTIVITY_CREATE_ACTIVITY_INVALID_INPUT,
  ACTIVITY_CREATE_ACTIVITY_SPORT_NOT_FOUND,
} from '~/src/modules/Activity/Infrastructure/ApiCodes'
import {
  Body,
  Controller,
  Post,
  Inject,
  UseGuards,
  UnauthorizedException,
  UnprocessableEntityException,
  InternalServerErrorException,
  Get,
  Header,
} from '@nestjs/common'

@Controller('activity')
export class ActivityController {
  constructor(
    @Inject(CREATE_ACTIVITY) private readonly createActivityUseCase: CreateActivity,
    @Inject(GET_SPORTS) private readonly getSportsUseCase: GetSports,
  ) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async create(@AccessToken() accessToken: JwtPayload, @Body() body: CreateActivityBodyDto) {
    const requestDto: CreateActivityApplicationRequestDto = {
      ...body,
      userId: accessToken.sub,
    }

    const result = await this.createActivityUseCase.execute(requestDto)

    if (result.success) {
      return result.value
    }

    const error = result.error

    switch (error.id) {
      case CreateActivityApplicationError.userDisabledId:
      case CreateActivityApplicationError.userNotFoundId:
        throw new UnauthorizedException({
          code: UNAUTHORIZED_ACCESS,
          message: 'Unauthorized access',
        })

      case CreateActivityApplicationError.sportNotFoundId:
        throw new UnprocessableEntityException({
          code: ACTIVITY_CREATE_ACTIVITY_SPORT_NOT_FOUND,
          message: error.message,
        })

      case CreateActivityApplicationError.invalidInputId:
        throw new UnprocessableEntityException({
          code: ACTIVITY_CREATE_ACTIVITY_INVALID_INPUT,
          message: error.message,
          errors: error.errors,
        })

      default:
        throw new InternalServerErrorException(result.error)
    }
  }

  @Get('/sports')
  @Header('Cache-Control', 'public, max-age=86400')
  async getSports() {
    return this.getSportsUseCase.execute()
  }
}
