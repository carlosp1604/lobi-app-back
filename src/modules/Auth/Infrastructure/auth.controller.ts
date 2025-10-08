import { Controller, Inject, Body, Post } from '@nestjs/common'
import { LOGIN_USER } from '~/src/modules/Auth/Infrastructure/auth.tokens'
import { LoginUser } from '~/src/modules/Auth/Application/LoginUser/LoginUser'

@Controller('auth')
export class AuthController {
  constructor(@Inject(LOGIN_USER) private readonly loginUser: LoginUser) {}

  @Post('login')
  login() {
    return 'WIP...'
  }
}
