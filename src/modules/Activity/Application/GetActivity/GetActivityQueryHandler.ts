import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { GetActivityQuery } from '~/src/modules/Activity/Application/GetActivity/GetActivityQuery'
import { GetActivityQueryError } from '~/src/modules/Activity/Application/GetActivity/GetActivityQueryError'
import { Result, fail, success } from '~/src/modules/Shared/Domain/Result'
import { SpecTranslatorFactory } from '~/src/modules/Activity/Application/Translator/Config/Spec/SpecTranslatorFactory'
import { ActivityFinderInterface } from '~/src/modules/Activity/Application/GetActivity/ActivityFinderInterface'
import { CapabilityTranslatorFactory } from '~/src/modules/Activity/Application/Translator/Config/Capability/CapabilityTranslatorFactory'
import { GetActivityResponseDto } from '~/src/modules/Activity/Application/GetActivity/GetActivityResponseDto'
import { GetActivityQueryResponseDtoTranslator } from '~/src/modules/Activity/Application/GetActivity/GetActivityQueryResponseDtoTranslator'

type ValidatedQuery = {
  userId: Identifier | null
  activityId: Identifier
}

export class GetActivityQueryHandler {
  constructor(
    private readonly activityFinder: ActivityFinderInterface,
    private readonly capabilityTranslatorFactory: CapabilityTranslatorFactory,
    private readonly specTranslatorFactory: SpecTranslatorFactory,
  ) {}

  public async execute(query: GetActivityQuery): Promise<Result<GetActivityResponseDto, GetActivityQueryError>> {
    const validatedQueryDataResult = this.validateQueryData(query)

    if (!validatedQueryDataResult.success) {
      return validatedQueryDataResult
    }

    const { userId, activityId } = validatedQueryDataResult.value

    const data = await this.activityFinder.find(activityId, userId)

    if (!data) {
      return fail(GetActivityQueryError.activityNotFound())
    }

    return success(
      new GetActivityQueryResponseDtoTranslator(this.capabilityTranslatorFactory, this.specTranslatorFactory).translate({
        rawData: data,
        userId,
      }),
    )
  }

  private validateQueryData(request: GetActivityQuery): Result<ValidatedQuery, GetActivityQueryError> {
    let userId: Identifier | null = null

    if (request.userId) {
      const userIdResult = Identifier.safeCreate(request.userId)

      if (!userIdResult.success) {
        return fail(GetActivityQueryError.invalidUserId(userIdResult.error.message))
      }

      userId = userIdResult.value
    }

    const activityIdResult = Identifier.safeCreate(request.activityId)

    if (!activityIdResult.success) {
      return fail(GetActivityQueryError.invalidActivityId(activityIdResult.error.message))
    }

    const activityId = activityIdResult.value

    return success({ userId, activityId })
  }
}
