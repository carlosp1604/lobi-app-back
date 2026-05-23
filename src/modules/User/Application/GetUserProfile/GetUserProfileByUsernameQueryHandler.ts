import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'
import { UserFinderInterface } from '~/src/modules/User/Application/GetUserProfile/UserFinderInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { GetUserProfileByUsernameQuery } from '~/src/modules/User/Application/GetUserProfile/GetUserProfileByUsernameQuery'
import { GetUserProfileByUsernameQueryError } from '~/src/modules/User/Application/GetUserProfile/GetUserProfileByUsernameQueryError'
import { GetUserProfileByUsernameQueryResponseDto } from '~/src/modules/User/Application/GetUserProfile/GetUserProfileByUsernameQueryResponseDto'
import { GetUserProfileByUsernameQueryResponseDtoTranslator } from '~/src/modules/User/Application/GetUserProfile/GetUserProfileByUsernameQueryResponseDtoTranslator'

type ValidatedQuery = {
  username: UserUsername
}

export class GetUserProfileByUsernameQueryHandler {
  constructor(private readonly userFinder: UserFinderInterface) {}

  async execute(
    query: GetUserProfileByUsernameQuery,
  ): Promise<Result<GetUserProfileByUsernameQueryResponseDto, GetUserProfileByUsernameQueryError>> {
    const validatedQuery = this.validateQuery(query)

    if (!validatedQuery.success) {
      return validatedQuery
    }

    const { username } = validatedQuery.value

    const data = await this.userFinder.findByUsername(username)

    if (!data) {
      return fail(GetUserProfileByUsernameQueryError.userNotFound())
    }

    const responseDto = new GetUserProfileByUsernameQueryResponseDtoTranslator().translate(data)

    return success(responseDto)
  }

  private validateQuery(query: GetUserProfileByUsernameQuery): Result<ValidatedQuery, GetUserProfileByUsernameQueryError> {
    const usernameResult = UserUsername.safeCreate(query.username)

    if (!usernameResult.success) {
      return fail(GetUserProfileByUsernameQueryError.invalidUsername(usernameResult.error.message))
    }

    const username = usernameResult.value

    return success({ username })
  }
}
