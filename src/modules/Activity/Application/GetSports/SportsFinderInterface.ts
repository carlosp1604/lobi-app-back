import { SportDetailsReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportDetailsReadModel'

export interface SportsFinderInterface {
  /**
   * Retrieves all available sports
   * @returns An array of SportDetailsReadModel
   */
  find(): Promise<Array<SportDetailsReadModel>>
}
