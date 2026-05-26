import type { FastifyReply, FastifyRequest } from 'fastify'
import { LoginUser } from '~/src/modules/Auth/Application/LoginUser/LoginUser'
import {
  CLIENT_METADATA_SERVICE,
  CLOSE_USER_SESSION,
  CREATE_USER,
  GENERATE_VERIFICATION_TOKEN,
  GET_USER_SECURITY_DETAILS_QUERY_HANDLER,
  LOGIN_USER,
  LOGOUT_USER,
  REFRESH_SESSION,
  REQUEST_METADATA_EXTRACTOR,
  RESET_USER_PASSWORD,
  VALIDATE_VERIFICATION_TOKEN,
} from '~/src/modules/Auth/Infrastructure/auth.tokens'
import { LoginUserBodyDto } from '~/src/modules/Auth/Infrastructure/Dtos/login-user-body.dto'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import { LoginUserApplicationRequestDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationRequestDto'
import {
  AUTH_CLOSE_SESSION_INVALID_SESSION_ID_FORMAT,
  AUTH_CREATE_USER_DUPLICATED_DATA,
  AUTH_CREATE_USER_INVALID_INPUT,
  AUTH_CREATE_USER_INVALID_TOKEN,
  AUTH_CREATE_USER_TOKEN_ALREADY_EXPIRED,
  AUTH_CREATE_USER_TOKEN_ALREADY_USED,
  AUTH_LOGIN_INVALID_EMAIL,
  AUTH_LOGIN_INVALID_PASSWORD_FORMAT,
  AUTH_REFRESH_INVALID_TOKEN_FORMAT,
  AUTH_RESET_PASSWORD_INVALID_EMAIL_FORMAT,
  AUTH_RESET_PASSWORD_INVALID_PASSWORD_FORMAT,
  AUTH_RESET_PASSWORD_INVALID_TOKEN,
  AUTH_RESET_PASSWORD_INVALID_TOKEN_FORMAT,
  AUTH_RESET_PASSWORD_SAME_PASSWORD,
  AUTH_RESET_PASSWORD_TOKEN_ALREADY_EXPIRED,
  AUTH_RESET_PASSWORD_TOKEN_ALREADY_USED,
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
  GET_USER_SECURITY_DETAILS_USER_NOT_FOUND,
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
  Get,
  Delete,
  Param,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { RefreshSessionApplicationRequestDto } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationRequestDto'
import { RefreshSession } from '~/src/modules/Auth/Application/RefreshSession/RefreshSession'
import { RefreshSessionApplicationError } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationError'
import { RefreshToken } from '~/src/modules/Auth/Infrastructure/Decorators/refresh-token.decorator'
import { UNAUTHORIZED_ACCESS } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { RefreshTokenGuard } from '~/src/modules/Auth/Infrastructure/Guards/refresh-token.guard'
import { GenerateVerificationToken } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationToken'
import { GenerateVerificationTokenApplicationRequestDto } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationRequestDto'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerifyEmailDto } from '~/src/modules/Auth/Infrastructure/Dtos/verify-email.dto'
import { GenerateVerificationTokenApplicationError } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationError'
import { ValidateVerificationTokenApplicationRequestDto } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationRequestDto'
import { ValidateVerificationToken } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationToken'
import { ValidateVerificationTokenError } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationError'
import { ValidateTokenBodyDto } from '~/src/modules/Auth/Infrastructure/Dtos/validate-token-body.dto'
import { CreateUser } from '~/src/modules/Auth/Application/CreateUser/CreateUser'
import { CreateUserBodyDto } from '~/src/modules/Auth/Infrastructure/Dtos/create-user-body.dto'
import { CreateUserApplicationRequestDto } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationRequestDto'
import { CreateUserApplicationError } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationError'
import { ResetUserPasswordBodyDto } from '~/src/modules/Auth/Infrastructure/Dtos/reset-user-password-body.dto'
import { ResetUserPasswordApplicationRequestDto } from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPasswordApplicationRequestDto'
import { ResetUserPassword } from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPassword'
import {
  ResetUserPasswordApplicationError,
  ResetUserPasswordError,
} from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPasswordApplicationError'
import { AccessTokenGuard } from '~/src/modules/Auth/Infrastructure/Guards/access-token.guard'
import { LogoutUser } from '~/src/modules/Auth/Application/LogoutUser/LogoutUser'
import { LogoutUserApplicationRequestDto } from '~/src/modules/Auth/Application/LogoutUser/LogoutUserApplicationRequestDto'
import { AccessToken } from '~/src/modules/Auth/Infrastructure/Decorators/access-token.decorator'
import type { JwtPayload } from '~/src/modules/Auth/Infrastructure/jwt-payload.schema'
import { LogoutUserApplicationError } from '~/src/modules/Auth/Application/LogoutUser/LogoutUserApplicationError'
import { OptionalAuth } from '~/src/modules/Auth/Infrastructure/Decorators/optional-auth.decorator'
import { GetUserSecurityDetailsQueryHandler } from '~/src/modules/Auth/Application/GetUserSecurityDetails/GetUserSecurityDetailsQueryHandler'
import { GetUserSecurityDetailsQuery } from '~/src/modules/Auth/Application/GetUserSecurityDetails/GetUserSecurityDetailsQuery'
import { GetUserSecurityDetailsQueryError } from '~/src/modules/Auth/Application/GetUserSecurityDetails/GetUserSecurityDetailsQueryError'
import { CloseUserSession } from '~/src/modules/Auth/Application/CloseUserSession/CloseUserSession'
import { CloseUserSessionApplicationRequestDto } from '~/src/modules/Auth/Application/CloseUserSession/CloseUserSessionApplicationRequestDto'
import { CloseUserSessionApplicationError } from '~/src/modules/Auth/Application/CloseUserSession/CloseUserSessionApplicationError'
import type { RequestMetadataExtractorInterface } from '~/src/modules/Shared/Infrastructure/Services/RequestMetadataExtractorInterface'
import { ClientMetadataApplicationService } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationService'
import { LOGGER_FACTORY } from '~/src/modules/Shared/Infrastructure/logger.module'
import type { LoggerFactoryInterface } from '~/src/modules/Shared/Domain/LoggerFactoryInterface'
import type { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'

@Controller('auth')
export class AuthController {
  private readonly loggerService: LoggerServiceInterface

  constructor(
    @Inject(LOGIN_USER) private readonly loginUser: LoginUser,
    @Inject(REFRESH_SESSION) private readonly refreshSession: RefreshSession,
    @Inject(GENERATE_VERIFICATION_TOKEN) private readonly generateVerificationToken: GenerateVerificationToken,
    @Inject(VALIDATE_VERIFICATION_TOKEN) private readonly validateVerificationToken: ValidateVerificationToken,
    @Inject(CREATE_USER) private readonly createUser: CreateUser,
    @Inject(RESET_USER_PASSWORD) private readonly resetUserPassword: ResetUserPassword,
    @Inject(LOGOUT_USER) private readonly logoutUser: LogoutUser,
    @Inject(CLOSE_USER_SESSION) private readonly closeUserSession: CloseUserSession,
    @Inject(GET_USER_SECURITY_DETAILS_QUERY_HANDLER)
    private readonly getUserSecurityDetailsQueryHandler: GetUserSecurityDetailsQueryHandler,
    @Inject(REQUEST_METADATA_EXTRACTOR) private readonly requestMetadataExtractor: RequestMetadataExtractorInterface,
    @Inject(CLIENT_METADATA_SERVICE) private readonly clientMetadataService: ClientMetadataApplicationService,
    @Inject(LOGGER_FACTORY) private readonly loggerFactory: LoggerFactoryInterface,
    private readonly configService: ConfigService<Env, true>,
  ) {
    this.loggerService = loggerFactory.createLogger(AuthController.name)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() request: FastifyRequest, @Body() body: LoginUserBodyDto, @Res({ passthrough: true }) response: FastifyReply) {
    const requestMetadataDto = this.requestMetadataExtractor.extract(request)

    const clientMetadata = await this.clientMetadataService.process(requestMetadataDto)

    const requestDto: LoginUserApplicationRequestDto = {
      email: body.email,
      password: body.password,
      clientMetadata,
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
        result.error.id === LoginUserApplicationError.userNotFoundId ||
        result.error.id === LoginUserApplicationError.userDisabledId
      ) {
        throw new UnauthorizedException({
          code: UNAUTHORIZED_ACCESS,
          message: 'Unauthorized access',
        })
      }

      if (result.error.id === LoginUserApplicationError.userDoesNotHaveCredentialsId) {
        throw new InternalServerErrorException(result.error)
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
  async refresh(@Req() request: FastifyRequest, @Res({ passthrough: true }) response: FastifyReply, @RefreshToken() token: string) {
    const requestMetadataDto = this.requestMetadataExtractor.extract(request)

    const clientMetadata = await this.clientMetadataService.process(requestMetadataDto)

    const requestDto: RefreshSessionApplicationRequestDto = { token, clientMetadata }

    const result = await this.refreshSession.execute(requestDto)

    if (!result.success) {
      if (
        result.error.id === RefreshSessionApplicationError.userNotFoundId ||
        result.error.id === RefreshSessionApplicationError.userDisabledId ||
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
  async verifyEmailCreateAccount(@Req() request: FastifyRequest, @Body() body: VerifyEmailDto) {
    const requestMetadataDto = this.requestMetadataExtractor.extract(request)

    const clientMetadata = await this.clientMetadataService.process(requestMetadataDto)

    const requestDto: GenerateVerificationTokenApplicationRequestDto = {
      purpose: VerificationTokenPurpose.createAccount().toString(),
      email: body.email,
      // TODO: Use language from request when multi-language emails are supported
      // language: body.language,
      sendNewToken: body.sendNewToken,
      clientMetadata,
    }

    const result = await this.generateVerificationToken.execute(requestDto)

    if (!result.success) {
      return this.handleVerifyEmailError(result.error)
    }
  }

  @Post('verify-email/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyEmailResetPassword(@Req() request: FastifyRequest, @Body() body: VerifyEmailDto) {
    const requestMetadataDto = this.requestMetadataExtractor.extract(request)

    const clientMetadata = await this.clientMetadataService.process(requestMetadataDto)

    const requestDto: GenerateVerificationTokenApplicationRequestDto = {
      purpose: VerificationTokenPurpose.resetPassword().toString(),
      email: body.email,
      // TODO: Use language from request when multi-language emails are supported
      // language: body.language,
      sendNewToken: body.sendNewToken,
      clientMetadata,
    }

    const result = await this.generateVerificationToken.execute(requestDto)

    if (!result.success) {
      return this.handleVerifyEmailError(result.error)
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
  async signup(@Req() request: FastifyRequest, @Body() body: CreateUserBodyDto) {
    const requestMetadataDto = this.requestMetadataExtractor.extract(request)

    const clientMetadata = await this.clientMetadataService.process(requestMetadataDto)

    const requestDto: CreateUserApplicationRequestDto = {
      email: body.email,
      username: body.username,
      name: body.name,
      password: body.password,
      token: body.token,
      requestedRole: body.requestedRole,
      clientMetadata,
    }

    const result = await this.createUser.execute(requestDto)

    if (!result.success) {
      const { id: errorId, message: errorMessage, errors } = result.error

      const obfuscatedErrors = [
        CreateUserApplicationError.tokenNotFoundId,
        CreateUserApplicationError.tokenPurposeMismatchId,
        CreateUserApplicationError.tokenInvalidOwnerId,
        CreateUserApplicationError.invalidVerificationTokenId,
      ]

      if (errorId === CreateUserApplicationError.invalidInputId) {
        throw new UnprocessableEntityException({
          code: AUTH_CREATE_USER_INVALID_INPUT,
          message: errorMessage,
          errors,
        })
      }

      if (errorId === CreateUserApplicationError.duplicatedDataId) {
        throw new ConflictException({
          code: AUTH_CREATE_USER_DUPLICATED_DATA,
          message: errorMessage,
          errors,
        })
      }

      if (obfuscatedErrors.includes(errorId)) {
        throw new NotFoundException({
          code: AUTH_CREATE_USER_INVALID_TOKEN,
          message: 'Invalid verification token',
        })
      }

      if (errorId === CreateUserApplicationError.tokenExpiredId) {
        throw new GoneException({
          code: AUTH_CREATE_USER_TOKEN_ALREADY_EXPIRED,
          message: errorMessage,
        })
      }

      if (errorId === CreateUserApplicationError.tokenAlreadyUsedId) {
        throw new ConflictException({
          code: AUTH_CREATE_USER_TOKEN_ALREADY_USED,
          message: errorMessage,
        })
      }

      throw new InternalServerErrorException(result.error)
    }

    return
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Req() request: FastifyRequest, @Body() body: ResetUserPasswordBodyDto) {
    const requestMetadataDto = this.requestMetadataExtractor.extract(request)

    const clientMetadata = await this.clientMetadataService.process(requestMetadataDto)

    const requestDto: ResetUserPasswordApplicationRequestDto = {
      email: body.email,
      token: body.token,
      password: body.password,
      clientMetadata,
    }

    const result = await this.resetUserPassword.execute(requestDto)

    if (!result.success) {
      const errorId = result.error.id

      if (errorId === ResetUserPasswordApplicationError.invalidInputId) {
        throw new UnprocessableEntityException({
          message: 'One or more fields have invalid formats',
          errors: result.error.errors.map((error) => {
            switch (error.id) {
              case ResetUserPasswordError.invalidEmailId:
                return {
                  code: AUTH_RESET_PASSWORD_INVALID_EMAIL_FORMAT,
                  message: error.message,
                }
              case ResetUserPasswordError.invalidPasswordId:
                return {
                  code: AUTH_RESET_PASSWORD_INVALID_PASSWORD_FORMAT,
                  message: error.message,
                }
              case ResetUserPasswordError.invalidTokenFormatId:
                return {
                  code: AUTH_RESET_PASSWORD_INVALID_TOKEN_FORMAT,
                  message: error.message,
                }
              default:
                throw new InternalServerErrorException(result.error)
            }
          }),
        })
      }

      if (errorId === ResetUserPasswordApplicationError.notFoundId) {
        throw new NotFoundException({
          code: AUTH_RESET_PASSWORD_INVALID_TOKEN,
          message: 'Invalid verification token',
        })
      }

      if (errorId === ResetUserPasswordApplicationError.invalidTokenId) {
        const specificError = result.error.errors[0]

        switch (specificError.id) {
          case ResetUserPasswordError.tokenExpiredId:
            throw new GoneException({
              code: AUTH_RESET_PASSWORD_TOKEN_ALREADY_EXPIRED,
              message: specificError.message,
            })

          case ResetUserPasswordError.tokenAlreadyUsedId:
            throw new ConflictException({
              code: AUTH_RESET_PASSWORD_TOKEN_ALREADY_USED,
              message: specificError.message,
            })

          case ResetUserPasswordError.tokenPurposeMismatchId:
          case ResetUserPasswordError.tokenInvalidOwnerId:
          case ResetUserPasswordError.invalidVerificationTokenId:
            throw new NotFoundException({
              code: AUTH_RESET_PASSWORD_INVALID_TOKEN,
              message: 'Invalid verification token',
            })

          default:
            throw new InternalServerErrorException(result.error)
        }
      }

      if (errorId === ResetUserPasswordApplicationError.cannotResetPasswordId) {
        throw new ConflictException({
          code: AUTH_RESET_PASSWORD_SAME_PASSWORD,
          message: 'New password cannot be the same as the current password',
        })
      }

      if (errorId === ResetUserPasswordApplicationError.inconsistentStateId) {
        throw new InternalServerErrorException(result.error)
      }

      throw new InternalServerErrorException(result.error)
    }

    return
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @OptionalAuth()
  @UseGuards(AccessTokenGuard)
  async logout(@AccessToken() accessToken: JwtPayload | undefined, @Res({ passthrough: true }) response: FastifyReply) {
    if (!accessToken) {
      this.clearCookies(response)

      return
    }

    const requestDto: LogoutUserApplicationRequestDto = {
      userId: accessToken.sub,
      sessionId: accessToken.sid,
    }

    const result = await this.logoutUser.execute(requestDto)

    if (!result.success) {
      const errorId = result.error.id

      const obfuscatedErrors = [
        LogoutUserApplicationError.userNotFoundId,
        LogoutUserApplicationError.userDisabledId,
        LogoutUserApplicationError.cannotRevokeSessionId,
        LogoutUserApplicationError.sessionNotFoundId,
        LogoutUserApplicationError.sessionDoesNotBelongToUserId,
        LogoutUserApplicationError.invalidSessionIdId,
        LogoutUserApplicationError.invalidUserIdId,
      ]

      if (obfuscatedErrors.includes(errorId)) {
        this.clearCookies(response)

        return
      }

      throw new InternalServerErrorException(result.error)
    }

    this.clearCookies(response)

    return
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenGuard)
  async closeSession(
    @AccessToken() accessToken: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    const requestMetadataDto = this.requestMetadataExtractor.extract(request)

    const clientMetadata = await this.clientMetadataService.process(requestMetadataDto)

    const requestDto: CloseUserSessionApplicationRequestDto = {
      sessionId: id,
      userId: accessToken.sub,
      currentSessionId: accessToken.sid,
      clientMetadata,
    }

    const result = await this.closeUserSession.execute(requestDto)

    const isCurrentSession = id === accessToken.sid

    if (!result.success) {
      const errorId = result.error.id

      const fatalSystemErrors = [
        CloseUserSessionApplicationError.invalidUserIdId,
        CloseUserSessionApplicationError.invalidCurrentSessionIdId,
        CloseUserSessionApplicationError.userNotFoundId,
        CloseUserSessionApplicationError.userDisabledId,
      ]

      if (fatalSystemErrors.includes(errorId)) {
        this.clearCookies(response)
        return
      }

      const targetSessionErrors = [
        CloseUserSessionApplicationError.cannotRevokeSessionId,
        CloseUserSessionApplicationError.sessionNotFoundId,
        CloseUserSessionApplicationError.sessionDoesNotBelongToUserId,
      ]

      if (targetSessionErrors.includes(errorId)) {
        if (isCurrentSession) {
          this.clearCookies(response)
        }
        return
      }

      if (errorId === CloseUserSessionApplicationError.invalidSessionIdId) {
        throw new UnprocessableEntityException({
          code: AUTH_CLOSE_SESSION_INVALID_SESSION_ID_FORMAT,
          message: result.error.message,
        })
      }

      throw new InternalServerErrorException(result.error)
    }

    if (isCurrentSession) {
      this.clearCookies(response)
    }

    return
  }

  @Get('security-details')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async activeSessions(@AccessToken() accessToken: JwtPayload, @Res({ passthrough: true }) response: FastifyReply) {
    const sessionId = accessToken.sid
    const userId = accessToken.sub

    const query = new GetUserSecurityDetailsQuery(userId, sessionId)

    const result = await this.getUserSecurityDetailsQueryHandler.execute(query)

    if (result.success) {
      const responseDto = result.value
      const currenSessionExists = responseDto.sessions.find((session) => session.id === sessionId)

      if (!currenSessionExists) {
        this.loggerService.warn('Inconsistent state', {
          reason: 'The user session is no longer valid (revoked or expired)',
          userId,
          sessionId,
        })

        this.clearCookies(response)

        throw new UnauthorizedException({
          code: UNAUTHORIZED_ACCESS,
          message: 'Unauthorized access',
        })
      }

      return responseDto
    }

    const error = result.error

    if (
      error.id === GetUserSecurityDetailsQueryError.invalidUserIdId ||
      error.id === GetUserSecurityDetailsQueryError.invalidSessionIdId
    ) {
      this.loggerService.error('Validation mismatch', error.stack, {
        reason: 'Controller allowed an input that domain rejected',
        error: error.message,
        userId,
        sessionId,
      })

      throw new InternalServerErrorException('Validation mismatch: Controller (AuthGuard) allowed an input that domain rejected', {
        cause: result.error,
      })
    }

    if (error.id === GetUserSecurityDetailsQueryError.userNotFoundId) {
      this.loggerService.warn('Inconsistent state', {
        reason: 'Active access token presented for a deleted or inactive user',
        userId,
        sessionId,
      })

      this.clearCookies(response)

      throw new NotFoundException({
        code: GET_USER_SECURITY_DETAILS_USER_NOT_FOUND,
        message: error.message,
      })
    }

    throw new InternalServerErrorException(result.error)
  }

  private handleVerifyEmailError(error: GenerateVerificationTokenApplicationError) {
    const obfuscatedErrors = [
      GenerateVerificationTokenApplicationError.userNotFoundId,
      GenerateVerificationTokenApplicationError.userDisabledId,
    ]

    if (obfuscatedErrors.includes(error.id)) {
      return
    }

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
      sameSite: 'lax' as const,
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

  private clearCookies(response: FastifyReply) {
    const cookieBase = {
      path: '/',
      sameSite: 'lax' as const,
      httpOnly: true,
      secure: this.configService.get('isProduction', { infer: true }),
    }

    const refreshTokenCookieName = this.configService.get('REFRESH_COOKIE_NAME', { infer: true })
    const accessTokenCookieName = this.configService.get('ACCESS_COOKIE_NAME', { infer: true })
    const invalidatedSessionHeaderName = this.configService.get('INVALIDATED_SESSION_HEADER_NAME', { infer: true })

    response.header(invalidatedSessionHeaderName, 'true')

    response.clearCookie(refreshTokenCookieName, {
      ...cookieBase,
    })

    response.clearCookie(accessTokenCookieName, {
      ...cookieBase,
    })
  }
}
