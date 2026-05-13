export const AVAILABLE_SPECS = ['individual_participants', 'team_participants'] as const

export type AvailableSpec = (typeof AVAILABLE_SPECS)[number]

export type EnforceAvailableSpecKeys<T extends Record<AvailableSpec, any>> = T

export const isAvailableSpec = (value: string): value is AvailableSpec => {
  return AVAILABLE_SPECS.includes(value as AvailableSpec)
}
