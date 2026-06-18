import { GetUserProfileByUsernameQuery } from '~/src/modules/User/Application/GetUserProfile/GetUserProfileByUsernameQuery'
import { GetUserProfileByUsernameQueryError } from '~/src/modules/User/Application/GetUserProfile/GetUserProfileByUsernameQueryError'
import { GetUserProfileByUsernameQueryHandler } from '~/src/modules/User/Application/GetUserProfile/GetUserProfileByUsernameQueryHandler'
import { GET_USER_PROFILE_BY_USERNAME_QUERY_HANDLER } from '~/src/modules/User/Infrastructure/user.tokens'
import {
  GET_USER_PROFILE_BY_USERNAME_INVALID_USERNAME,
  GET_USER_PROFILE_BY_USERNAME_USER_NOT_FOUND,
} from '~/src/modules/User/Infrastructure/ApiCodes'
import {
  Controller,
  Inject,
  HttpStatus,
  HttpCode,
  InternalServerErrorException,
  Get,
  Param,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common'

@Controller('users')
export class UserController {
  constructor(
    @Inject(GET_USER_PROFILE_BY_USERNAME_QUERY_HANDLER)
    private readonly getUserProfileByUsernameQueryHandler: GetUserProfileByUsernameQueryHandler,
  ) {}

  @Get('profile/:username')
  @HttpCode(HttpStatus.OK)
  async userProfile(@Param('username') username: string) {
    const query = new GetUserProfileByUsernameQuery(username)

    const result = await this.getUserProfileByUsernameQueryHandler.execute(query)

    if (!result.success) {
      const errorId = result.error.id

      if (errorId === GetUserProfileByUsernameQueryError.invalidUsernameId) {
        throw new UnprocessableEntityException({
          code: GET_USER_PROFILE_BY_USERNAME_INVALID_USERNAME,
          message: result.error.message,
        })
      }

      if (errorId === GetUserProfileByUsernameQueryError.userNotFoundId) {
        throw new NotFoundException({
          code: GET_USER_PROFILE_BY_USERNAME_USER_NOT_FOUND,
          message: result.error.message,
        })
      }

      throw new InternalServerErrorException(result.error)
    }

    return result.value
  }
}
