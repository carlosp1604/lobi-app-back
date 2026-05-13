import { SpecClass } from '~/src/modules/Activity/Domain/Config/Spec/SpecInterface'
import { EnforceAvailableSpecKeys } from '~/src/modules/Activity/Domain/Config/Spec/AvailableSpecs'
import {
  IndividualParticipantsSpec,
  IndividualParticipantsSpecInputProps,
  IndividualParticipantsSpecPrimitives,
} from '~/src/modules/Activity/Domain/Config/Spec/IndividualParticipantsSpec'
import {
  TeamParticipantsSpec,
  TeamParticipantsSpecInputProps,
  TeamParticipantsSpecPrimitives,
} from '~/src/modules/Activity/Domain/Config/Spec/TeamParticipantsSpec'

export type SpecTypes<Instance, Input, Primitives> = {
  instance: Instance
  input: Input
  primitives: Primitives
}

export type SpecTypeMap = EnforceAvailableSpecKeys<{
  individual_participants: SpecTypes<
    IndividualParticipantsSpec,
    IndividualParticipantsSpecInputProps,
    IndividualParticipantsSpecPrimitives
  >
  team_participants: SpecTypes<TeamParticipantsSpec, TeamParticipantsSpecInputProps, TeamParticipantsSpecPrimitives>
}>

export class SpecRegistry {
  private static readonly registry: {
    [K in keyof SpecTypeMap]: SpecClass<SpecTypeMap[K]['instance'], SpecTypeMap[K]['input'], SpecTypeMap[K]['primitives']>
  } = {
    [IndividualParticipantsSpec.specName]: IndividualParticipantsSpec,
    [TeamParticipantsSpec.specName]: TeamParticipantsSpec,
  }

  public static getConstructor<K extends keyof SpecTypeMap>(name: K) {
    const constructor = this.registry[name]

    if (!constructor) {
      throw new Error(`Spec "${name}" is not registered`)
    }

    return constructor
  }

  public static areEqual<K extends keyof SpecTypeMap>(
    spec: SpecTypeMap[K]['instance'],
    otherSpec: SpecTypeMap[K]['instance'],
  ): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return spec.equals(otherSpec as any)
  }
}
