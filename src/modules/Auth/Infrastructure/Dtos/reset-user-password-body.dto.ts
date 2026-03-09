import { UserPassword } from '~/src/modules/Auth/Domain/ValueObject/UserPassword'
import { VerificationTokenValue } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenValue'
import { IsEmail, IsNotEmpty, IsString, Length, MaxLength, MinLength } from 'class-validator'

export class ResetUserPasswordBodyDto {
  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsString()
  @IsNotEmpty()
  @Length(VerificationTokenValue.LENGTH, VerificationTokenValue.LENGTH)
  token: string

  @IsString()
  @IsNotEmpty()
  @MinLength(UserPassword.MIN_LENGTH)
  @MaxLength(UserPassword.MAX_LENGTH)
  password: string
}
