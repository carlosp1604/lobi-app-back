import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class ValidateTokenBodyDto {
  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  purpose: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  token: string
}
