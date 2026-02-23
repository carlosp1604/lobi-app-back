import { IsBoolean, IsEmail, IsNotEmpty } from 'class-validator'

export class VerifyEmailDto {
  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsBoolean()
  sendNewToken: boolean

  // TODO: Define language when multi-language emails are supported
  // @IsNotEmpty()
  // @IsString()
  // @IsIn(i18nConfig.locales)
  // language: string
}
