export interface GetUserProfileByUsernameQueryResponseDto {
  readonly id: string
  readonly name: string
  readonly username: string
  readonly imageUrl: string | null
  readonly bio: string | null
  readonly birthDate: string | null
  readonly createdAt: string
}
