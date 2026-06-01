import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ActivityListReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityListReadModel'
import { GetActivitiesCriteria } from '~/src/modules/Activity/Application/Shared/GetActivitiesCriteria'

export interface ActivitiesFinderInterface {
  /**
   * Finds activities based on the provided criteria
   * If a User ID is provided, it includes the user's relationship context for each activity
   * @param criteria Criteria to apply to the search
   * @param userId User ID
   * @param now The current date to evaluate temporal filters
   * @returns ActivityListReadModel with the results
   */
  find(criteria: GetActivitiesCriteria, userId: Identifier | null, now: Date): Promise<ActivityListReadModel>
}
