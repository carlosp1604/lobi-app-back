import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportLevelQueryDto } from '~/src/modules/Activity/Application/Dto/Sport/SportLevelQueryDto'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { MultipleChoiceCapabilitySchemaDto } from '~/src/modules/Activity/Application/Config/Capability/CapabilitySchemaDto'
import { RankingCapability, RankingCapabilityInputProps } from '~/src/modules/Activity/Domain/Config/Capability/RankingCapability'
import {
  CapabilityPayloadValidationError,
  CapabilityPayloadContractInterface,
} from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractInterface'

export type RankingCapabilityRawData = {
  ids: Array<string>
}

export class RankingCapabilityPayloadContract
  implements CapabilityPayloadContractInterface<RankingCapabilityInputProps, Array<SportLevelQueryDto>>
{
  public static readonly capabilityName = 'ranking'

  public validate(rawData: unknown): Result<RankingCapabilityInputProps, CapabilityPayloadValidationError> {
    const typeCheck = TypeValidator.validate<RankingCapabilityRawData>(rawData, {
      ids: { type: 'array', items: { type: 'string' } },
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    const { ids } = typeCheck.value

    if (ids.length < RankingCapability.minSupportedLevels || ids.length > RankingCapability.maxSupportedLevels) {
      return fail({
        errors: [`Expected between ${RankingCapability.minSupportedLevels} and ${RankingCapability.maxSupportedLevels} ranking levels`],
      })
    }

    return success({ ids })
  }

  public getSchema(options: Array<SportLevelQueryDto>): MultipleChoiceCapabilitySchemaDto {
    return {
      name: RankingCapability.capabilityName,
      type: 'multiple_choice',
      isRequired: false,
      options,
      min: RankingCapability.minSupportedLevels.toString(),
      max: options.length.toString(),
    }
  }
}
