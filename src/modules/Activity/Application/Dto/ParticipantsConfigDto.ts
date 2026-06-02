export type ParticipationConfigType = 'individual' | 'team'

export interface IndividualParticipantsConfigDto {
  readonly type: ParticipationConfigType
  readonly minPlayers: number
  readonly maxPlayers: number
}

export interface TeamParticipantsConfigDto {
  readonly type: ParticipationConfigType
  readonly minPlayers: number
  readonly minTeams: number
  readonly maxTeams: number
  readonly playersPerTeam: number
}
