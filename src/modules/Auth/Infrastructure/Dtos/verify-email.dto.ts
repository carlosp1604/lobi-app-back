import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator'
import { i18nConfig } from '~/i18n.config'

export class VerifyEmailDto {
  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsBoolean()
  sendNewToken: boolean

  @IsNotEmpty()
  @IsString()
  @IsIn(i18nConfig.locales)
  language: string
}
