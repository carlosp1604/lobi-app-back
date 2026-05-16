import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ActivityDetailsReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityDetailsReadModel'

export interface ActivityFinderInterface {
  /**
   * Finds an activity by ID
   * If a User ID is provided, it includes the user's relationship context for each activity
   * @param activityId Activity ID
   * @param userId User ID
   * @returns ActivityDetailsReadModel If activity is found, otherwise null
   */
  find(activityId: Identifier, userId: Identifier | null): Promise<ActivityDetailsReadModel | null>
}
