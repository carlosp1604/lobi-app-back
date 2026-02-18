import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CreateUserBodyDto {
  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  token: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  username: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  requestedRole: string
}
