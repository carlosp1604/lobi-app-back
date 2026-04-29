import { Activity } from '~/src/modules/Activity/Domain/Activity'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'

export interface ActivityRepositoryInterface {
  /**
   * Persists the given activity
   * @param activity Activity to save
   * @param context The transactional context
   */
  save(activity: Activity, context?: TxContext): Promise<void>
}
