import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { OwnerProfile } from '~/src/modules/User/Domain/Profile/OwnerProfile'
import { SportsmanProfile } from '~/src/modules/User/Domain/Profile/SportsmanProfile'

export interface ProfileRepositoryInterface {
  /**
   * Persists a new Owner Profile in the database
   * @param ownerProfile The OwnerProfile domain entity to insert
   * @param context The transactional context
   */
  saveOwnerProfile(ownerProfile: OwnerProfile, context?: TxContext): Promise<void>

  /**
   * Persists a new Sportsman Profile in the database
   * @param sportsmanProfile The SportsmanProfile domain entity to insert
   * @param context The transactional context
   */
  saveSportsmanProfile(sportsmanProfile: SportsmanProfile, context?: TxContext): Promise<void>
}
