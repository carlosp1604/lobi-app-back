import {
  Body,
  Controller,
  Post,
  Inject,
  UseGuards,
  UnauthorizedException,
  UnprocessableEntityException,
  InternalServerErrorException,
} from '@nestjs/common'
import { AccessTokenGuard } from '~/src/modules/Auth/Infrastructure/Guards/access-token.guard'
import { AccessToken } from '~/src/modules/Auth/Infrastructure/Decorators/access-token.decorator'
import type { JwtPayload } from '~/src/modules/Auth/Infrastructure/jwt-payload.schema'
import { CREATE_ACTIVITY } from '~/src/modules/Activity/Infrastructure/activity.tokens'
import { CreateActivity } from '~/src/modules/Activity/Application/CreateActivity/CreateActivity'
import { CreateActivityBodyDto } from '~/src/modules/Activity/Infrastructure/Dtos/create-activity-body.dto'
import { CreateActivityApplicationRequestDto } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityApplicationRequestDto'
import { CreateActivityApplicationError } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityApplicationError'
import { UNAUTHORIZED_ACCESS } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import {
  ACTIVITY_CREATE_ACTIVITY_INVALID_INPUT,
  ACTIVITY_CREATE_ACTIVITY_SPORT_NOT_FOUND,
} from '~/src/modules/Activity/Infrastructure/ApiCodes'

@Controller('activity')
export class ActivityController {
  constructor(@Inject(CREATE_ACTIVITY) private readonly createActivity: CreateActivity) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async create(@AccessToken() accessToken: JwtPayload, @Body() body: CreateActivityBodyDto) {
    const requestDto: CreateActivityApplicationRequestDto = {
      ...body,
      userId: accessToken.sub,
    }

    const result = await this.createActivity.execute(requestDto)

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
}
