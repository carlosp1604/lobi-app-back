import { Activity } from '~/src/modules/Activity/Domain/Activity'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ActivityDetailsModel } from '~/src/modules/Activity/Domain/ReadModel/ActivityDetailsModel'

export interface ActivityRepositoryInterface {
  /**
   * Persists the given activity
   * @param activity Activity to save
   * @param context The transactional context
   */
  save(activity: Activity, context?: TxContext): Promise<void>

  /**
   * Finds an activity by ID
   * @param id Activity ID
   * @param context The transactional context
   * @returns The Activity entity if found, otherwise null
   */
  findById(id: Identifier, context?: TxContext): Promise<Activity | null>

  /**
   * Finds activity details by ID
   * @param id Activity ID
   * @param participantId Participant ID
   * @returns The ActivityDetailsModel if found, otherwise null
   */
  findDetailsById(id: Identifier, participantId: Identifier | null): Promise<ActivityDetailsModel | null>
}
