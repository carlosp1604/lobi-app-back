import { RankingLevel } from '~/src/modules/Activity/Domain/Sport/Ranking/RankingLevel'
import { PaceCapability } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/PaceCapability'
import { SpeedCapability } from './Capabilities/SpeedCapability'
import { ParticipantsSpec } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Specs/ParticipantsSpec'
import { RankingCapability } from './Capabilities/RankingCapability'
import { DistanceCapability } from './Capabilities/DistanceCapability'
import { LocationCapability } from './Capabilities/LocationCapability'
import { SportSpecInterface } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Specs/SportSpecInterface'
import { SportBaseCapability } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/SportBaseCapability'

export enum SupportedSportSlug {
  FOOTBALL = 'football',
  FUTSAL = 'futsal',
  PADEL = 'padel',
  TENNIS = 'tennis',
  CYCLING = 'cycling',
  RUNNING = 'running',
}

export enum ValidSportModality {
  TEAM = 'team',
  INDIVIDUAL = 'individual',
  FREE = 'free',
}

export type SportTemplateProps = {
  modality: ValidSportModality
  specs: Array<SportSpecInterface<any>>
  capabilities: Array<SportBaseCapability<any>>
}

const mvpRankingLevels = [
  new RankingLevel('rookie-id', 'rookie', []),
  new RankingLevel('amateur-id', 'amateur', []),
  new RankingLevel('semi-pro-id', 'semi_pro', []),
  new RankingLevel('pro-id', 'pro', []),
]

export const SPORT_REGISTRY_MAP: Record<SupportedSportSlug, SportTemplateProps> = {
  [SupportedSportSlug.PADEL]: {
    modality: ValidSportModality.TEAM,
    specs: [
      new ParticipantsSpec({
        defaultMinPlayers: 4,
        maxPlayersLimit: 4,
        teamsModule: {
          required: true,
          defaultMinTeams: 2,
          defaultMaxTeams: 2,
          defaultPlayersPerTeam: 2,
        },
      }),
    ],
    capabilities: [new RankingCapability(mvpRankingLevels), new LocationCapability()],
  },

  [SupportedSportSlug.FUTSAL]: {
    modality: ValidSportModality.TEAM,
    specs: [
      new ParticipantsSpec({
        defaultMinPlayers: 8,
        maxPlayersLimit: 15,
        teamsModule: {
          required: true,
          defaultMinTeams: 2,
          defaultMaxTeams: 3,
          defaultPlayersPerTeam: 5,
        },
      }),
    ],
    capabilities: [new RankingCapability(mvpRankingLevels), new LocationCapability()],
  },

  [SupportedSportSlug.TENNIS]: {
    modality: ValidSportModality.INDIVIDUAL,
    specs: [
      new ParticipantsSpec({
        defaultMinPlayers: 2,
        maxPlayersLimit: 4,
        teamsModule: {
          required: true,
          defaultMinTeams: 2,
          defaultMaxTeams: 2,
          defaultPlayersPerTeam: 1,
        },
      }),
    ],
    capabilities: [new RankingCapability(mvpRankingLevels), new LocationCapability()],
  },

  [SupportedSportSlug.CYCLING]: {
    modality: ValidSportModality.FREE,
    specs: [
      new ParticipantsSpec({
        defaultMinPlayers: 1, // TODO: CHECK
        maxPlayersLimit: 100, // TODO: CHECK
        teamsModule: undefined,
      }),
    ],
    capabilities: [new DistanceCapability(), new SpeedCapability(), new LocationCapability()],
  },

  [SupportedSportSlug.FOOTBALL]: {
    modality: ValidSportModality.TEAM,
    specs: [
      new ParticipantsSpec({
        defaultMinPlayers: 14,
        maxPlayersLimit: 22,
        teamsModule: {
          required: true,
          defaultMinTeams: 2,
          defaultMaxTeams: 2,
          defaultPlayersPerTeam: 11,
        },
      }),
    ],
    capabilities: [new RankingCapability(mvpRankingLevels), new LocationCapability()],
  },

  [SupportedSportSlug.RUNNING]: {
    modality: ValidSportModality.FREE,
    specs: [
      new ParticipantsSpec({
        defaultMinPlayers: 1,
        maxPlayersLimit: 500,
      }),
    ],
    capabilities: [new DistanceCapability(), new PaceCapability(), new LocationCapability()],
  },
}
