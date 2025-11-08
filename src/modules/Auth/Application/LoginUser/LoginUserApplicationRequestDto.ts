export interface LoginUserApplicationRequestDto {
  password: string
  email: string
  ip: string
  userAgent: string | undefined
}
