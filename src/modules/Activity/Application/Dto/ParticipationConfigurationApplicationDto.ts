export interface IndividualParticipationConfigurationApplicationDto {
  readonly type: 'individual'
  readonly minCapacity: number
  readonly maxCapacity: number
}

export interface TeamParticipationConfigurationApplicationDto {
  readonly type: 'team'
  readonly minCapacity: number
  readonly maxCapacity: number
  readonly minTeams: number
  readonly maxTeams: number
  readonly minToPlay: number
  readonly playersPerTeam: number
}
