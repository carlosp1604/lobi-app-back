export interface UserProfileDetailsWithoutImageUrlReadModel {
  id: string
  name: string
  username: string
  bio: string | null
  birth_date: Date | null
  created_at: Date
}

export type UserProfileDetailsReadModel = UserProfileDetailsWithoutImageUrlReadModel & { image_url: string | null }
