import { EntitySchema } from 'typeorm'
import { UserRawModel } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { ActivityRawModel } from '~/src/modules/Activity/Infrastructure/Entities/activity.entity'

export interface ParticipationRawModel {
  id: string
  activity_id: string
  user_id: string
  joined_at: Date
  left_at: Date | null
}

export type ParticipationRawModelWithRelations = ParticipationRawModel & Partial<{ user: UserRawModel; activity: ActivityRawModel }>

export const ParticipationEntity = new EntitySchema<ParticipationRawModelWithRelations>({
  name: 'ParticipationEntity',
  tableName: 'participations',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      nullable: false,
    },
    activity_id: {
      type: 'uuid',
      nullable: false,
    },
    user_id: {
      type: 'uuid',
      nullable: false,
    },
    joined_at: {
      type: 'timestamptz',
      nullable: false,
    },
    left_at: {
      type: 'timestamptz',
      nullable: true,
    },
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'UserEntity',
      joinColumn: {
        name: 'user_id',
        referencedColumnName: 'id',
      },
      onDelete: 'CASCADE',
    },
    activity: {
      type: 'many-to-one',
      target: 'ActivityEntity',
      joinColumn: {
        name: 'activity_id',
        referencedColumnName: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
})
