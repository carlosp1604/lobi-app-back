import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class LoginUserBodyDto {
  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @IsString()
  password: string
}
