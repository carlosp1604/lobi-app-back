import type { FastifyReply, FastifyRequest } from 'fastify'
import { LoginUser } from '~/src/modules/Auth/Application/LoginUser/LoginUser'
import { LOGIN_USER } from '~/src/modules/Auth/Infrastructure/auth.tokens'
import { LoginUserBodyDto } from '~/src/modules/Auth/Infrastructure/Dtos/login-user-body.dto'
import { INTERNAL_SERVER_ERROR } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import { LoginUserApplicationRequestDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationRequestDto'
import { AUTH_LOGIN_INVALID_EMAIL, AUTH_LOGIN_UNAUTHORIZED } from '~/src/modules/Auth/Infrastructure/ApiCodes'
import { Body, Controller, Post, Inject, Res, Req, HttpStatus, HttpCode } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'

const REFRESH_COOKIE = 'x-refresh-token'
const ACCESS_COOKIE = 'x-access-token'

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(LOGIN_USER) private readonly loginUser: LoginUser,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginUserBodyDto, @Req() request: FastifyRequest, @Res({ passthrough: true }) response: FastifyReply) {
    let ip = ''
    let userAgent = ''

    if (request.headers['x-forwarded-for']) {
      ip = String(request.headers['x-forwarded-for']).split(',')[0]?.trim()
    } else {
      if (request.ip) {
        ip = request.ip
      }
    }

    if (request.headers['user-agent']) {
      userAgent = String(request.headers['user-agent'])
    }

    const requestDto: LoginUserApplicationRequestDto = {
      email: body.email,
      password: body.password,
      ip,
      userAgent,
    }

    const result = await this.loginUser.execute(requestDto)

    if (!result.success) {
      if (result.error.id === LoginUserApplicationError.invalidUserEmailId) {
        response.status(HttpStatus.UNPROCESSABLE_ENTITY)
        return {
          code: AUTH_LOGIN_INVALID_EMAIL,
          message: result.error.message,
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          traceId: request.id,
        }
      }

      if (
        result.error.id === LoginUserApplicationError.invalidCredentialsId ||
        result.error.id === LoginUserApplicationError.userDoesNotHaveCredentialsId ||
        result.error.id === LoginUserApplicationError.userNotFoundId
      ) {
        response.status(HttpStatus.UNAUTHORIZED)
        return {
          code: AUTH_LOGIN_UNAUTHORIZED,
          message: 'Unauthorized access',
          status: HttpStatus.UNAUTHORIZED,
          traceId: request.id,
        }
      }

      response.status(HttpStatus.INTERNAL_SERVER_ERROR)
      return {
        code: INTERNAL_SERVER_ERROR,
        message: 'Something went wrong while processing your request',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        traceId: request.id,
      }
    }

    const { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt } = result.value

    const cookieBase = {
      path: '/',
      sameSite: 'strict' as const,
      httpOnly: true,
      secure: this.configService.get('isProduction', { infer: true }),
    }

    response.setCookie(REFRESH_COOKIE, refreshToken, {
      ...cookieBase,
      expires: refreshTokenExpiresAt,
    })
    response.setCookie(ACCESS_COOKIE, accessToken, {
      ...cookieBase,
      expires: accessTokenExpiresAt,
    })

    return result.value
  }
}
