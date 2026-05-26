export interface UserProfileDetailsWithoutImageUrlReadModel {
  id: string
  name: string
  username: string
  bio: string | null
  birth_date: string | null
  created_at: string
}

export type UserProfileDetailsReadModel = UserProfileDetailsWithoutImageUrlReadModel & { image_url: string | null }
