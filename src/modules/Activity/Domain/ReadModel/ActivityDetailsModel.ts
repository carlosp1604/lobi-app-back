import { Activity } from '~/src/modules/Activity/Domain/Activity'
import { Participation } from '~/src/modules/Activity/Domain/Participation/Participation'

interface HostDetailsModel {
  id: string
  username: string
  name: string
  userUploadId: string | null
  isActive: boolean
}

interface SportDetailsModel {
  id: string
  slug: string
  imageUrl: string | null
}

export interface ActivityDetailsModel {
  activity: Activity
  participation: Participation | null
  sport: SportDetailsModel
  host: HostDetailsModel
}
