import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { ActivityRepositoryInterface } from '~/src/modules/Activity/Domain/ActivityRepositoryInterface'
import { GetActivityApplicationError } from '~/src/modules/Activity/Application/GetActivity/GetActivityApplicationError'
import { GetActivityApplicationRequestDto } from '~/src/modules/Activity/Application/GetActivity/GetActivityApplicationRequestDto'
import { GetActivityApplicationResponseDto } from '~/src/modules/Activity/Application/GetActivity/GetActivityApplicationResponseDto'
import { GetActivityApplicationResponseDtoTranslator } from '~/src/modules/Activity/Application/GetActivity/GetActivityApplicationResponseDtoTranslator'

type ValidatedRequest = {
  userId: Identifier | null
  activityId: Identifier
}

export class GetActivity {
  constructor(private readonly activityRepository: ActivityRepositoryInterface) {}

  public async execute(
    request: GetActivityApplicationRequestDto,
  ): Promise<Result<GetActivityApplicationResponseDto, GetActivityApplicationError>> {
    const validatedRequestResult = this.validateRequest(request)

    if (!validatedRequestResult.success) {
      return validatedRequestResult
    }

    const { userId, activityId } = validatedRequestResult.value

    const activityDetails = await this.activityRepository.findDetailsById(activityId, userId)

    if (!activityDetails) {
      return fail(GetActivityApplicationError.activityNotFound())
    }

    return success(
      new GetActivityApplicationResponseDtoTranslator().translate({
        activityDetails,
        userId,
      }),
    )
  }

  private validateRequest(request: GetActivityApplicationRequestDto): Result<ValidatedRequest, GetActivityApplicationError> {
    let userId: Identifier | null = null

    if (request.userId) {
      const userIdResult = Identifier.safeCreate(request.userId)

      if (!userIdResult.success) {
        return fail(GetActivityApplicationError.invalidUserId(userIdResult.error.message))
      }

      userId = userIdResult.value
    }

    const activityIdResult = Identifier.safeCreate(request.activityId)

    if (!activityIdResult.success) {
      return fail(GetActivityApplicationError.invalidActivityId(activityIdResult.error.message))
    }

    const activityId = activityIdResult.value

    return success({
      userId,
      activityId,
    })
  }
}
