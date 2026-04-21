import { Slug } from '~/src/modules/Shared/Domain/ValueObject/Slug'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { RPECapability } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/RPECapability'
import { PaceCapability } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/PaceCapability'
import { RouteCapability } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/RouteCapability'
import { SpeedCapability } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/SpeedCapability'
import { ParticipantsSpec } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Specs/ParticipantsSpec'
import { RankingCapability } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/RankingCapability'
import { AltitudeCapability } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/AltitudeCapability'
import { DistanceCapability } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/DistanceCapability'
import { DurationCapability } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/DurationCapability'
import { LocationCapability } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/LocationCapability'
import { BasicSportRankingSystem } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Ranking/BasicSportRankingSystem'
import { LocationRangeCapability } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/LocationRangeCapability'
import { Sport, SportHydrationProps } from '~/src/modules/Activity/Domain/Sport/Sport'

export enum SupportedSportSlug {
  // Football
  FOOTBALL = 'football',
  FOOTBALL_7 = 'football-7',
  FUTSAL = 'futsal',
  BEACH_FOOTBALL = 'beach-football',

  // Basketball
  BASKETBALL = 'basketball',
  BASKETBALL_3 = 'basketball-3-3',
  BASKETBALL_1 = 'basketball-1-1',

  // Volleyball
  VOLLEYBALL = 'volleyball',
  BEACH_VOLLEY = 'beach-volley',

  // Racket
  PADEL = 'padel',
  TENNIS = 'tennis',
  TENNIS_DOUBLES = 'tennis-doubles',
  PING_PONG = 'ping-pong',
  PICKLEBALL = 'pickleball',
  BADMINTON = 'badminton',

  // Outdoors
  CYCLING = 'cycling',
  RUNNING = 'running',
  HIKING = 'hiking',

  // Fitness
  FUNCTIONAL_TRAINING = 'functional-training',
  YOGA = 'yoga',

  // Chess
  CHESS = 'chess',
}

export enum ValidSportModality {
  TEAM = 'team',
  INDIVIDUAL = 'individual',
  FREE = 'free',
}

export class SportFactory {
  public static create(slug: SupportedSportSlug): Sport | null {
    const props = this.getPropsBySlug(slug)

    if (!props) {
      return null
    }

    return Sport.hydrate(props)
  }

  private static getPropsBySlug(slug: SupportedSportSlug): SportHydrationProps | null {
    const sportSlug = Slug.fromString(slug)
    const defaultCapabilities = [new LocationCapability(), new RankingCapability(BasicSportRankingSystem)]
    const outdoorsCapability = [
      new AltitudeCapability(),
      new DistanceCapability(),
      new DurationCapability(),
      new LocationRangeCapability(),
      new PaceCapability(),
      new RankingCapability(BasicSportRankingSystem),
      new RouteCapability(),
      new RPECapability(),
      new SpeedCapability(),
    ]

    switch (slug) {
      case SupportedSportSlug.FOOTBALL:
        return {
          id: Identifier.fromString('157f7943-7f7d-45e0-8e6c-7e390c525f3c'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 22,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 11 },
            }),
          ],
        }

      case SupportedSportSlug.FOOTBALL_7:
        return {
          id: Identifier.fromString('9153545d-7521-4f36-9b16-953e5e098679'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 14,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 7 },
            }),
          ],
        }

      case SupportedSportSlug.FUTSAL:
        return {
          id: Identifier.fromString('f3b0c1a2-9b1e-4e4a-9b1e-4e4a9b1e4e4a'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 10,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 5 },
            }),
          ],
        }

      case SupportedSportSlug.BEACH_FOOTBALL:
        return {
          id: Identifier.fromString('d2d2a4a3-7647-4933-9112-9856f675865d'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 10,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 5 },
            }),
          ],
        }

      case SupportedSportSlug.BASKETBALL:
        return {
          id: Identifier.fromString('e88659e6-1aa8-4932-a65a-b4cbc22d4af2'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 10,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 5 },
            }),
          ],
        }

      case SupportedSportSlug.BASKETBALL_3:
        return {
          id: Identifier.fromString('7419e7a8-8e6c-4b53-8373-199148d42d3c'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 6,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 3 },
            }),
          ],
        }

      case SupportedSportSlug.BASKETBALL_1:
        return {
          id: Identifier.fromString('36df11c0-6fb7-4093-b9b0-3b24fab302bd'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 2,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 1 },
            }),
          ],
        }

      case SupportedSportSlug.VOLLEYBALL:
        return {
          id: Identifier.fromString('b1679093-5755-46f5-9371-332303c737c3'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 12,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 6 },
            }),
          ],
        }

      case SupportedSportSlug.BEACH_VOLLEY:
        return {
          id: Identifier.fromString('1873e351-789a-4c28-9122-12501a617631'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 4,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 2 },
            }),
          ],
        }

      case SupportedSportSlug.PADEL:
        return {
          id: Identifier.fromString('d0f2f2d6-ecc7-49ff-b07c-bd471e437fa1'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 4,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 2 },
            }),
          ],
        }

      case SupportedSportSlug.TENNIS:
        return {
          id: Identifier.fromString('8673752e-2e65-4f3b-857e-3796245d614d'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 2,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 1 },
            }),
          ],
        }

      case SupportedSportSlug.TENNIS_DOUBLES:
        return {
          id: Identifier.fromString('0873e3a1-7b9a-4c28-9122-12501a617631'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 4,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 2 },
            }),
          ],
        }

      case SupportedSportSlug.PICKLEBALL:
        return {
          id: Identifier.fromString('9762a4a3-7647-4933-9112-9856f675865d'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 2,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 1 },
            }),
          ],
        }

      case SupportedSportSlug.BADMINTON:
        return {
          id: Identifier.fromString('c1aebb5e-cdfd-4c65-b205-ea6f53041114'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 2,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 1 },
            }),
          ],
        }

      case SupportedSportSlug.PING_PONG:
        return {
          id: Identifier.fromString('7273e351-7b9a-4c28-9122-12501a617631'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 2,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 1 },
            }),
          ],
        }

      case SupportedSportSlug.CYCLING:
        return {
          id: Identifier.fromString('f1679093-5755-46f5-9371-332303c737c3'),
          slug: sportSlug,
          modality: ValidSportModality.INDIVIDUAL,
          imageUrl: null,
          capabilities: outdoorsCapability,
          specs: [new ParticipantsSpec({ defaultMinPlayers: 1 })],
        }

      case SupportedSportSlug.RUNNING:
        return {
          id: Identifier.fromString('5dccb50a-1ed6-4ffe-911b-b103f0409e57'),
          slug: sportSlug,
          modality: ValidSportModality.INDIVIDUAL,
          imageUrl: null,
          capabilities: outdoorsCapability,
          specs: [new ParticipantsSpec({ defaultMinPlayers: 1 })],
        }

      case SupportedSportSlug.HIKING:
        return {
          id: Identifier.fromString('7422a4a3-7647-4933-9112-9856f675865d'),
          slug: sportSlug,
          modality: ValidSportModality.INDIVIDUAL,
          imageUrl: null,
          capabilities: outdoorsCapability,
          specs: [new ParticipantsSpec({ defaultMinPlayers: 1 })],
        }

      case SupportedSportSlug.CHESS:
        return {
          id: Identifier.fromString('7e3e6d63-f0f6-4d62-9c36-fe1813057033'),
          slug: sportSlug,
          modality: ValidSportModality.TEAM,
          imageUrl: null,
          capabilities: defaultCapabilities,
          specs: [
            new ParticipantsSpec({
              defaultMinPlayers: 2,
              teamsModule: { defaultTeams: 2, defaultPlayersPerSide: 1 },
            }),
          ],
        }

      case SupportedSportSlug.YOGA:
        return {
          id: Identifier.fromString('b452a4a3-7647-4933-9112-9856f675865d'),
          slug: sportSlug,
          modality: ValidSportModality.INDIVIDUAL,
          imageUrl: null,
          capabilities: [...defaultCapabilities, new RPECapability()],
          specs: [new ParticipantsSpec({ defaultMinPlayers: 1 })],
        }

      case SupportedSportSlug.FUNCTIONAL_TRAINING:
        return {
          id: Identifier.fromString('e153545d-7521-4f36-9b16-953e5e098679'),
          slug: sportSlug,
          modality: ValidSportModality.INDIVIDUAL,
          imageUrl: null,
          capabilities: [...defaultCapabilities, new RPECapability()],
          specs: [new ParticipantsSpec({ defaultMinPlayers: 1 })],
        }

      default:
        return null
    }
  }
}
