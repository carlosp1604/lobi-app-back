import type { FastifyReply } from 'fastify'
import { LoginUser } from '~/src/modules/Auth/Application/LoginUser/LoginUser'
import {
  CREATE_USER,
  GENERATE_VERIFICATION_TOKEN,
  LOGIN_USER,
  REFRESH_SESSION,
  VALIDATE_VERIFICATION_TOKEN,
} from '~/src/modules/Auth/Infrastructure/auth.tokens'
import { LoginUserBodyDto } from '~/src/modules/Auth/Infrastructure/Dtos/login-user-body.dto'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import { LoginUserApplicationRequestDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationRequestDto'
import {
  AUTH_CREATE_USER_DUPLICATED_EMAIL,
  AUTH_CREATE_USER_DUPLICATED_USERNAME,
  AUTH_CREATE_USER_INVALID_EMAIL_FORMAT,
  AUTH_CREATE_USER_INVALID_NAME_FORMAT,
  AUTH_CREATE_USER_INVALID_PASSWORD_FORMAT,
  AUTH_CREATE_USER_INVALID_TOKEN,
  AUTH_CREATE_USER_INVALID_TOKEN_FORMAT,
  AUTH_CREATE_USER_INVALID_USER_ROLE,
  AUTH_CREATE_USER_INVALID_USERNAME_FORMAT,
  AUTH_CREATE_USER_TOKEN_ALREADY_EXPIRED,
  AUTH_CREATE_USER_TOKEN_ALREADY_USED,
  AUTH_LOGIN_INVALID_EMAIL,
  AUTH_LOGIN_INVALID_PASSWORD_FORMAT,
  AUTH_REFRESH_INVALID_TOKEN_FORMAT,
  AUTH_VALIDATE_TOKEN_ALREADY_EXPIRED,
  AUTH_VALIDATE_TOKEN_ALREADY_USED,
  AUTH_VALIDATE_TOKEN_INVALID_EMAIL,
  AUTH_VALIDATE_TOKEN_INVALID_PURPOSE,
  AUTH_VALIDATE_TOKEN_INVALID_TOKEN,
  AUTH_VALIDATE_TOKEN_INVALID_TOKEN_FORMAT,
  AUTH_VERIFY_EMAIL_EMAIL_ALREADY_TAKEN,
  AUTH_VERIFY_EMAIL_INVALID_EMAIL,
  AUTH_VERIFY_EMAIL_INVALID_PURPOSE,
  AUTH_VERIFY_EMAIL_TOKEN_ALREADY_ISSUED,
} from '~/src/modules/Auth/Infrastructure/ApiCodes'
import {
  Body,
  Controller,
  Post,
  Inject,
  Res,
  HttpStatus,
  HttpCode,
  InternalServerErrorException,
  UnauthorizedException,
  UnprocessableEntityException,
  UseGuards,
  ConflictException,
  GoneException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { RefreshSessionApplicationRequestDto } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationRequestDto'
import { RefreshSession } from '~/src/modules/Auth/Application/RefreshSession/RefreshSession'
import { RefreshSessionApplicationError } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationError'
import { RefreshTokenDecorator } from '~/src/modules/Auth/Infrastructure/Decorators/refresh-token.decorator'
import { UNAUTHORIZED_ACCESS } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { RefreshTokenGuard } from '~/src/modules/Auth/Infrastructure/Guards/refresh-token.guard'
import { GenerateVerificationToken } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationToken'
import { GenerateVerificationTokenApplicationRequestDto } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationRequestDto'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerifyEmailDto } from '~/src/modules/Auth/Infrastructure/Dtos/verify-email.dto'
import { GenerateVerificationTokenApplicationError } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationError'
import { UserAgent } from '~/src/modules/Shared/Infrastructure/Decorators/user-agent.decorator'
import { UserIp } from '~/src/modules/Shared/Infrastructure/Decorators/user-ip.decorator'
import { ValidateVerificationTokenApplicationRequestDto } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationRequestDto'
import { ValidateVerificationToken } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationToken'
import { ValidateVerificationTokenError } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationError'
import { ValidateTokenBodyDto } from '~/src/modules/Auth/Infrastructure/Dtos/validate-token-body.dto'
import { CreateUser } from '~/src/modules/Auth/Application/CreateUser/CreateUser'
import { CreateUserBodyDto } from '~/src/modules/Auth/Infrastructure/Dtos/create-user-body.dto'
import { CreateUserApplicationRequestDto } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationRequestDto'
import { CreateUserApplicationError, CreateUserError } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationError'

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(LOGIN_USER) private readonly loginUser: LoginUser,
    @Inject(REFRESH_SESSION) private readonly refreshSession: RefreshSession,
    @Inject(GENERATE_VERIFICATION_TOKEN) private readonly generateVerificationToken: GenerateVerificationToken,
    @Inject(VALIDATE_VERIFICATION_TOKEN) private readonly validateVerificationToken: ValidateVerificationToken,
    @Inject(CREATE_USER) private readonly createUser: CreateUser,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginUserBodyDto,
    @UserIp() userIp: string,
    @UserAgent() userAgent: string | undefined,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    const requestDto: LoginUserApplicationRequestDto = {
      email: body.email,
      password: body.password,
      ip: userIp,
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

      if (result.error.id === LoginUserApplicationError.invalidPasswordFormatId) {
        throw new UnprocessableEntityException({
          code: AUTH_LOGIN_INVALID_PASSWORD_FORMAT,
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
    @UserIp() userIp: string,
    @UserAgent() userAgent: string | undefined,
    @Res({ passthrough: true }) response: FastifyReply,
    @RefreshTokenDecorator() refreshTokenFromCookie: string,
  ) {
    const requestDto: RefreshSessionApplicationRequestDto = {
      ip: userIp,
      userAgent,
      token: refreshTokenFromCookie,
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

      if (result.error.id === RefreshSessionApplicationError.invalidTokenFormatId) {
        throw new UnprocessableEntityException({
          code: AUTH_REFRESH_INVALID_TOKEN_FORMAT,
          message: result.error.message,
        })
      }

      throw new InternalServerErrorException(result.error)
    }

    const { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt } = result.value

    this.setCookies(response, accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt)

    return result.value
  }

  @Post('verify-email/signup')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyEmailCreateAccount(@UserIp() userIp: string, @UserAgent() userAgent: string | undefined, @Body() body: VerifyEmailDto) {
    const requestDto: GenerateVerificationTokenApplicationRequestDto = {
      purpose: VerificationTokenPurpose.createAccount().toString(),
      email: body.email,
      language: body.language,
      sendNewToken: body.sendNewToken,
      ip: userIp,
      userAgent,
    }

    const result = await this.generateVerificationToken.execute(requestDto)

    if (!result.success) {
      this.handleVerifyEmailError(result.error)
    }
  }

  @Post('verify-email/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyEmailResetPassword(@UserIp() userIp: string, @UserAgent() userAgent: string | undefined, @Body() body: VerifyEmailDto) {
    const requestDto: GenerateVerificationTokenApplicationRequestDto = {
      purpose: VerificationTokenPurpose.resetPassword().toString(),
      email: body.email,
      language: body.language,
      sendNewToken: body.sendNewToken,
      ip: userIp,
      userAgent,
    }

    const result = await this.generateVerificationToken.execute(requestDto)

    if (!result.success) {
      this.handleVerifyEmailError(result.error)
    }
  }

  @Post('validate-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyToken(@Body() body: ValidateTokenBodyDto) {
    const requestDto: ValidateVerificationTokenApplicationRequestDto = {
      email: body.email,
      purpose: body.purpose,
      token: body.token,
    }

    const result = await this.validateVerificationToken.execute(requestDto)

    if (!result.success) {
      const errorId = result.error.id

      if (errorId === ValidateVerificationTokenError.invalidEmailId) {
        throw new UnprocessableEntityException({
          code: AUTH_VALIDATE_TOKEN_INVALID_EMAIL,
          message: result.error.message,
        })
      }

      if (errorId === ValidateVerificationTokenError.invalidTokenPurposeId) {
        throw new UnprocessableEntityException({
          code: AUTH_VALIDATE_TOKEN_INVALID_PURPOSE,
          message: result.error.message,
        })
      }

      if (errorId === ValidateVerificationTokenError.invalidTokenFormatId) {
        throw new UnprocessableEntityException({
          code: AUTH_VALIDATE_TOKEN_INVALID_TOKEN_FORMAT,
          message: result.error.message,
        })
      }

      if (errorId === ValidateVerificationTokenError.tokenAlreadyUsedId) {
        throw new ConflictException({
          code: AUTH_VALIDATE_TOKEN_ALREADY_USED,
          message: result.error.message,
        })
      }

      if (errorId === ValidateVerificationTokenError.tokenExpiredId) {
        throw new GoneException({
          code: AUTH_VALIDATE_TOKEN_ALREADY_EXPIRED,
          message: result.error.message,
        })
      }

      if (
        errorId === ValidateVerificationTokenError.tokenPurposeMismatchId ||
        errorId === ValidateVerificationTokenError.tokenNotFoundId ||
        errorId === ValidateVerificationTokenError.invalidTokenOwnerId ||
        errorId === ValidateVerificationTokenError.invalidTokenId
      ) {
        throw new NotFoundException({
          code: AUTH_VALIDATE_TOKEN_INVALID_TOKEN,
          message: 'Invalid verification token',
        })
      }

      throw new InternalServerErrorException(result.error)
    }

    return
  }

  @Post('signup')
  @HttpCode(HttpStatus.NO_CONTENT)
  async signup(@Body() body: CreateUserBodyDto, @UserIp() userIp: string, @UserAgent() userAgent: string | undefined) {
    const requestDto: CreateUserApplicationRequestDto = {
      email: body.email,
      username: body.username,
      name: body.name,
      password: body.password,
      token: body.token,
      requestedRole: body.requestedRole,
      ip: userIp,
      userAgent,
    }

    const result = await this.createUser.execute(requestDto)

    if (!result.success) {
      const errorId = result.error.id

      if (errorId === CreateUserApplicationError.invalidInputId) {
        throw new UnprocessableEntityException({
          message: 'One or more fields have invalid formats',
          errors: result.error.errors.map((createUserError) => {
            switch (createUserError.id) {
              case CreateUserError.invalidUsernameId:
                return {
                  code: AUTH_CREATE_USER_INVALID_USERNAME_FORMAT,
                  message: createUserError.message,
                }
              case CreateUserError.invalidEmailId:
                return {
                  code: AUTH_CREATE_USER_INVALID_EMAIL_FORMAT,
                  message: createUserError.message,
                }
              case CreateUserError.invalidPasswordId:
                return {
                  code: AUTH_CREATE_USER_INVALID_PASSWORD_FORMAT,
                  message: createUserError.message,
                }
              case CreateUserError.invalidTokenFormatId:
                return {
                  code: AUTH_CREATE_USER_INVALID_TOKEN_FORMAT,
                  message: createUserError.message,
                }
              case CreateUserError.invalidNameId:
                return {
                  code: AUTH_CREATE_USER_INVALID_NAME_FORMAT,
                  message: createUserError.message,
                }
              case CreateUserError.invalidRoleId:
                return {
                  code: AUTH_CREATE_USER_INVALID_USER_ROLE,
                  message: createUserError.message,
                }
              default:
                throw new InternalServerErrorException(result.error)
            }
          }),
        })
      }

      if (errorId === CreateUserApplicationError.duplicatedId) {
        throw new ConflictException({
          message: 'Some provided data is already in use',
          errors: result.error.errors.map((createUserError) => {
            switch (createUserError.id) {
              case CreateUserError.duplicatedEmailId:
                return {
                  code: AUTH_CREATE_USER_DUPLICATED_EMAIL,
                  message: createUserError.message,
                }
              case CreateUserError.duplicatedUsernameId:
                return {
                  code: AUTH_CREATE_USER_DUPLICATED_USERNAME,
                  message: createUserError.message,
                }
              default:
                throw new InternalServerErrorException(result.error)
            }
          }),
        })
      }

      if (errorId === CreateUserApplicationError.notFoundId) {
        throw new NotFoundException({
          code: AUTH_CREATE_USER_INVALID_TOKEN,
          message: 'Invalid verification token',
        })
      }

      if (errorId === CreateUserApplicationError.invalidTokenId) {
        const specificError = result.error.errors[0]

        switch (specificError.id) {
          case CreateUserError.tokenExpiredId:
            throw new GoneException({
              code: AUTH_CREATE_USER_TOKEN_ALREADY_EXPIRED,
              message: specificError.message,
            })

          case CreateUserError.tokenAlreadyUsedId:
            throw new ConflictException({
              code: AUTH_CREATE_USER_TOKEN_ALREADY_USED,
              message: specificError.message,
            })

          case CreateUserError.tokenPurposeMismatchId:
          case CreateUserError.tokenInvalidOwnerId:
          case CreateUserError.invalidVerificationTokenId:
            throw new NotFoundException({
              code: AUTH_CREATE_USER_INVALID_TOKEN,
              message: 'Invalid verification token',
            })

          default:
            throw new InternalServerErrorException(result.error)
        }
      }

      throw new InternalServerErrorException(result.error)
    }

    return
  }

  private handleVerifyEmailError(error: GenerateVerificationTokenApplicationError) {
    if (error.id === GenerateVerificationTokenApplicationError.invalidEmailId) {
      throw new UnprocessableEntityException({
        code: AUTH_VERIFY_EMAIL_INVALID_EMAIL,
        message: error.message,
      })
    }

    if (error.id === GenerateVerificationTokenApplicationError.invalidVerificationTokenPurposeId) {
      throw new UnprocessableEntityException({
        code: AUTH_VERIFY_EMAIL_INVALID_PURPOSE,
        message: error.message,
      })
    }

    if (error.id === GenerateVerificationTokenApplicationError.activeTokenAlreadyIssuedId) {
      throw new ConflictException({
        code: AUTH_VERIFY_EMAIL_TOKEN_ALREADY_ISSUED,
        message: error.message,
      })
    }

    if (error.id === GenerateVerificationTokenApplicationError.emailAlreadyTakenId) {
      throw new ConflictException({
        code: AUTH_VERIFY_EMAIL_EMAIL_ALREADY_TAKEN,
        message: error.message,
      })
    }

    throw new InternalServerErrorException(error)
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
