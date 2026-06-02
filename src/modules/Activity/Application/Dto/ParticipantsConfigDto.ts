export type ParticipationConfigType = 'individual' | 'team'

export interface IndividualParticipantsConfigQueryDto {
  readonly type: ParticipationConfigType
  readonly minPlayers: number
  readonly maxPlayers: number
}

export interface TeamParticipantsConfigQueryDto {
  readonly type: ParticipationConfigType
  readonly minPlayers: number
  readonly minTeams: number
  readonly maxTeams: number
  readonly playersPerTeam: number
}
