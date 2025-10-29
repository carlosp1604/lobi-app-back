export interface GenerateVerificationTokenApplicationRequestDto {
  email: string
  purpose: string
  sendNewToken: boolean
  language: string
}
