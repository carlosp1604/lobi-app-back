import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'
import { UserPassword } from '~/src/modules/Auth/Domain/ValueObject/UserPassword'

export class LoginUserBodyDto {
  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @IsString()
  @MinLength(UserPassword.MIN_LENGTH)
  @MaxLength(UserPassword.MAX_LENGTH)
  password: string
}
