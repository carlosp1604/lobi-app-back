import type { FastifyReply, FastifyRequest } from 'fastify'
import { LoginUser } from '~/src/modules/Auth/Application/LoginUser/LoginUser'
import { LOGIN_USER, REFRESH_SESSION } from '~/src/modules/Auth/Infrastructure/auth.tokens'
import { LoginUserBodyDto } from '~/src/modules/Auth/Infrastructure/Dtos/login-user-body.dto'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import { LoginUserApplicationRequestDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationRequestDto'
import { AUTH_LOGIN_INVALID_EMAIL } from '~/src/modules/Auth/Infrastructure/ApiCodes'
import {
  Body,
  Controller,
  Post,
  Inject,
  Res,
  Req,
  HttpStatus,
  HttpCode,
  InternalServerErrorException,
  UnauthorizedException,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { RefreshSessionApplicationRequestDto } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationRequestDto'
import { RefreshSession } from '~/src/modules/Auth/Application/RefreshSession/RefreshSession'
import { RefreshSessionApplicationError } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationError'
import { RefreshTokenDecorator } from '~/src/modules/Auth/Infrastructure/Decorators/refresh-token.decorator'
import { UNAUTHORIZED_ACCESS } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { RefreshTokenGuard } from '~/src/modules/Auth/Infrastructure/Guards/refresh-token.guard'

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(LOGIN_USER) private readonly loginUser: LoginUser,
    @Inject(REFRESH_SESSION) private readonly refreshSession: RefreshSession,
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
        throw new UnprocessableEntityException({
          code: AUTH_LOGIN_INVALID_EMAIL,
          message: result.error.message,
        })
      }

      if (
        result.error.id === LoginUserApplicationError.invalidCredentialsId ||
        result.error.id === LoginUserApplicationError.userDoesNotHaveCredentialsId ||
        result.error.id === LoginUserApplicationError.userNotFoundId
      ) {
        throw new UnauthorizedException({
          code: UNAUTHORIZED_ACCESS,
          message: 'Unauthorized access',
        })
      }

      throw new InternalServerErrorException(result.error)
    }

    const { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt } = result.value

    this.setCookies(response, accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt)

    return result.value
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() _request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
    @RefreshTokenDecorator() refreshTokenFromCookie: string,
  ) {
    const requestDto: RefreshSessionApplicationRequestDto = {
      refreshToken: refreshTokenFromCookie,
    }

    const result = await this.refreshSession.execute(requestDto)

    if (!result.success) {
      if (
        result.error.id === RefreshSessionApplicationError.userNotFoundId ||
        result.error.id === RefreshSessionApplicationError.sessionNotFoundId ||
        result.error.id === RefreshSessionApplicationError.sessionAlreadyExpiredId ||
        result.error.id === RefreshSessionApplicationError.sessionAlreadyRevokedId
      ) {
        throw new UnauthorizedException({
          code: UNAUTHORIZED_ACCESS,
          message: 'Unauthorized access',
        })
      }

      throw new InternalServerErrorException(result.error)
    }

    const { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt } = result.value

    this.setCookies(response, accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt)

    return result.value
  }

  private setCookies(
    response: FastifyReply,
    accessToken: string,
    refreshToken: string,
    accessTokenExpiresAt: Date,
    refreshTokenExpiresAt: Date,
  ) {
    const cookieBase = {
      path: '/',
      sameSite: 'strict' as const,
      httpOnly: true,
      secure: this.configService.get('isProduction', { infer: true }),
    }

    const refreshTokenCookieName = this.configService.get('REFRESH_COOKIE_NAME', { infer: true })
    const accessTokenCookieName = this.configService.get('ACCESS_COOKIE_NAME', { infer: true })

    response.setCookie(refreshTokenCookieName, refreshToken, {
      ...cookieBase,
      expires: refreshTokenExpiresAt,
    })
    response.setCookie(accessTokenCookieName, accessToken, {
      ...cookieBase,
      expires: accessTokenExpiresAt,
    })
  }
}
