import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { VerificationTokenRepositoryInterface } from '~/src/modules/Auth/Domain/VerificationTokenRepositoryInterface'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'
import { UserPassword } from '~/src/modules/Auth/Domain/ValueObject/UserPassword'
import { VerificationTokenValue } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenValue'
import { VerificationTokenEmail } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenEmail'
import { PasswordHash } from '~/src/modules/Auth/Domain/ValueObject/PasswordHash'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { ResetUserPasswordApplicationRequestDto } from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPasswordApplicationRequestDto'
import {
  ResetUserPasswordApplicationError,
  ResetUserPasswordError,
} from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPasswordApplicationError'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'

type ValidatedResetPasswordInput = {
  userEmail: UserEmail
  verificationTokenEmail: VerificationTokenEmail
  password: UserPassword
  tokenValue: VerificationTokenValue
}

export class ResetUserPassword {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly userCredentialRepository: UserCredentialRepositoryInterface,
    private readonly verificationTokenRepository: VerificationTokenRepositoryInterface,
    private readonly domainEventRepository: DomainEventRepositoryInterface,
    private readonly verifyTokenService: VerifyTokenService,
    private readonly hasherService: HasherServiceInterface,
    private readonly requestOriginApplicationService: RequestOriginApplicationService,
    private readonly clockService: ClockServiceInterface,
    private readonly unitOfWork: UnitOfWork,
    private readonly loggerService: LoggerServiceInterface,
    private readonly idGeneratorService: IdGeneratorServiceInterface,
  ) {}

  public async execute(request: ResetUserPasswordApplicationRequestDto): Promise<Result<void, ResetUserPasswordApplicationError>> {
    const now = this.clockService.now()

    const inputValidationResult = this.validateInput(request)

    if (!inputValidationResult.success) {
      return inputValidationResult
    }

    const { userEmail, verificationTokenEmail, password, tokenValue } = inputValidationResult.value

    const { userAgent, ipHash, deviceLocation } = await this.requestOriginApplicationService.process(request.ip, request.userAgent, {
      email: userEmail.value,
    })

    const newPasswordHashString = await this.hasherService.hash(password.value)
    const newPasswordHash = PasswordHash.fromString(newPasswordHashString)

    return this.unitOfWork.runInTransaction(async (context) => {
      const verificationToken = await this.verificationTokenRepository.findByEmailWithLock(verificationTokenEmail.value, context)

      if (!verificationToken) {
        return fail(ResetUserPasswordApplicationError.notFound(ResetUserPasswordError.tokenNotFound(verificationTokenEmail.value)))
      }

      const validateTokenResult = verificationToken.validate(now, verificationTokenEmail, VerificationTokenPurpose.resetPassword())

      if (!validateTokenResult.success) {
        return this.handleDomainError(validateTokenResult.error, verificationToken, userEmail)
      }

      const isCryptoValid = await this.verifyTokenService.verify(verificationToken, tokenValue.value)

      if (!isCryptoValid) {
        this.loggerService.warn('Token cryptography verification failed', { email: verificationTokenEmail.value })

        return fail(ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.invalidToken()))
      }

      const user = await this.userRepository.findByEmail(verificationTokenEmail.value, context)
      if (!user || !user.isActive()) {
        this.loggerService.warn('User not found or inactive', {
          email: userEmail.value,
          reason: user ? 'Inactive' : 'NotFound',
        })

        return fail(ResetUserPasswordApplicationError.notFound(ResetUserPasswordError.userNotFound(userEmail.value)))
      }

      const userCredential = await this.userCredentialRepository.findByUserId(user.id.value, context)
      if (!userCredential) {
        this.loggerService.error('Inconsistent state: Active user has no credentials', undefined, {
          userId: user.id.value,
        })
        return fail(ResetUserPasswordApplicationError.inconsistentState(user.id.value))
      }

      const passwordMatchCurrentOne = await this.hasherService.compare(password.value, userCredential.passwordHash.value)

      if (passwordMatchCurrentOne) {
        this.loggerService.warn('New password same as current', { userId: user.id.value })

        return fail(ResetUserPasswordApplicationError.cannotResetPassword())
      }

      userCredential.updatePasswordHash(newPasswordHash, now)
      verificationToken.markAsUsed(now, verificationTokenEmail, VerificationTokenPurpose.resetPassword())

      const domainEventId = this.idGeneratorService.generateId()
      const domainEvent = AuthDomainEventFactory.createPasswordResetEvent(
        domainEventId,
        user.id,
        user.email,
        deviceLocation,
        userAgent,
        ipHash,
        now,
      )

      await this.userCredentialRepository.update(userCredential, context)
      await this.verificationTokenRepository.update(verificationToken, context)
      await this.domainEventRepository.save(domainEvent, context)

      return success(undefined)
    })
  }

  private validateInput(
    request: ResetUserPasswordApplicationRequestDto,
  ): Result<ValidatedResetPasswordInput, ResetUserPasswordApplicationError> {
    const inputErrors: ResetUserPasswordError[] = []

    const userEmailResult = UserEmail.safeCreate(request.email)

    if (!userEmailResult.success) {
      inputErrors.push(ResetUserPasswordError.invalidEmail())
    }

    const tokenResult = VerificationTokenValue.safeCreate(request.token)
    if (!tokenResult.success) {
      inputErrors.push(ResetUserPasswordError.invalidTokenFormat())
    }

    const passwordResult = UserPassword.safeCreate(request.password)
    if (!passwordResult.success) {
      inputErrors.push(ResetUserPasswordError.invalidPassword())
    }

    if (!userEmailResult.success || !tokenResult.success || !passwordResult.success) {
      return fail(ResetUserPasswordApplicationError.invalidInput(inputErrors))
    }

    const verificationTokenEmail = VerificationTokenEmail.fromString(userEmailResult.value.value)

    return success({
      userEmail: userEmailResult.value,
      verificationTokenEmail: verificationTokenEmail,
      tokenValue: tokenResult.value,
      password: passwordResult.value,
    })
  }
  private handleDomainError(
    exception: VerificationTokenDomainException,
    verificationToken: VerificationToken,
    userEmail: UserEmail,
  ): Result<void, ResetUserPasswordApplicationError> {
    switch (exception.id) {
      case VerificationTokenDomainException.verificationTokenAlreadyExpiredId: {
        this.loggerService.warn('Verification token validation failed: tokenExpired', {
          message: exception.message,
          email: verificationToken.email.value,
          verificationTokenId: verificationToken.id.value,
          expiresAt: verificationToken.expiresAt,
        })

        return fail(ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.tokenExpired()))
      }

      case VerificationTokenDomainException.verificationTokenAlreadyUsedId: {
        this.loggerService.warn('Verification token validation failed: tokenAlreadyUsed', {
          message: exception.message,
          email: verificationToken.email.value,
          verificationTokenId: verificationToken.id.value,
          usedAt: verificationToken.usedAt,
        })

        return fail(ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.tokenAlreadyUsed()))
      }

      case VerificationTokenDomainException.verificationTokenCannotBeUsedByUserId: {
        this.loggerService.warn('Verification token validation failed: tokenInvalidOwner', {
          message: exception.message,
          email: verificationToken.email.value,
          ownerEmail: userEmail.value,
          verificationTokenId: verificationToken.id.value,
        })

        return fail(ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.tokenInvalidOwner()))
      }

      case VerificationTokenDomainException.verificationTokenCannotBeUsedForPurposeId: {
        this.loggerService.warn('Verification token validation failed: tokenPurposeMismatch', {
          message: exception.message,
          email: verificationToken.email.value,
          verificationTokenId: verificationToken.id.value,
          verificationTokenPurpose: verificationToken.purpose.value,
        })

        return fail(ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.tokenPurposeMismatch()))
      }

      default: {
        throw exception
      }
    }
  }
}
