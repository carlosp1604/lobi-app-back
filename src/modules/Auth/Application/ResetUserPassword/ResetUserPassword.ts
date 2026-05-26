import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { VerificationTokenRepositoryInterface } from '~/src/modules/Auth/Domain/VerificationTokenRepositoryInterface'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'
import { UserPassword } from '~/src/modules/Auth/Domain/ValueObject/UserPassword'
import { VerificationTokenValue } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenValue'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { ResetUserPasswordApplicationRequestDto } from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPasswordApplicationRequestDto'
import {
  ResetUserPasswordApplicationError,
  ResetUserPasswordError,
} from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPasswordApplicationError'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { PasswordHash } from '~/src/modules/Auth/Domain/ValueObject/PasswordHash'

type ValidatedResetPasswordInput = {
  email: EmailAddress
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
    private readonly clockService: ClockServiceInterface,
    private readonly unitOfWork: UnitOfWork,
    private readonly loggerService: LoggerServiceInterface,
    private readonly authDomainEventFactory: AuthDomainEventFactory,
  ) {}

  public async execute(request: ResetUserPasswordApplicationRequestDto): Promise<Result<void, ResetUserPasswordApplicationError>> {
    const now = this.clockService.now()

    const inputValidationResult = this.validateInput(request)

    if (!inputValidationResult.success) {
      return inputValidationResult
    }

    const { email, password, tokenValue } = inputValidationResult.value

    const { deviceInfo, userIpHash, deviceLocation } = request.clientMetadata

    const newPasswordHashString = await this.hasherService.hash(password.value)
    const newPasswordHash = PasswordHash.fromString(newPasswordHashString)

    return this.unitOfWork.runInTransaction(async (context) => {
      const verificationToken = await this.verificationTokenRepository.findByEmailWithLock(email.value, context)

      if (!verificationToken) {
        return fail(ResetUserPasswordApplicationError.tokenNotFound())
      }

      const validateTokenResult = verificationToken.validate(now, email, VerificationTokenPurpose.resetPassword())

      if (!validateTokenResult.success) {
        return this.handleDomainError(validateTokenResult.error, verificationToken, email)
      }

      const isCryptoValid = await this.verifyTokenService.verify(verificationToken, tokenValue.value)

      if (!isCryptoValid) {
        this.loggerService.warn('Token cryptography verification failed', {
          email: verificationToken.email.value,
          verificationTokenId: verificationToken.id.value,
          purpose: VerificationTokenPurpose.resetPassword().value,
        })

        return fail(ResetUserPasswordApplicationError.invalidToken())
      }

      const user = await this.userRepository.findByEmail(email.value, context)

      if (!user) {
        this.loggerService.warn('Data anomaly detected', {
          email: email.value,
          reason: 'Attempted to consume an orphaned reset-password token for a deleted user',
        })

        return fail(ResetUserPasswordApplicationError.userNotFound())
      }

      if (!user.isActive()) {
        this.loggerService.warn('Password reset rejected', {
          email: email.value,
          reason: 'User is disabled',
        })

        return fail(ResetUserPasswordApplicationError.userDisabled())
      }

      const userCredential = await this.userCredentialRepository.findByUserId(user.id.value, context)
      if (!userCredential) {
        this.loggerService.error('Inconsistent state', undefined, {
          userId: user.id.value,
          reason: 'Active user has no credentials',
        })
        return fail(ResetUserPasswordApplicationError.userDoesNotHaveCredentials())
      }

      const passwordMatchCurrentOne = await this.hasherService.compare(password.value, userCredential.passwordHash.value)

      if (passwordMatchCurrentOne) {
        this.loggerService.warn('Password reset rejected', {
          userId: user.id.value,
          reason: 'The new password is the same as the current one',
        })

        return fail(ResetUserPasswordApplicationError.samePasswordValue())
      }

      userCredential.updatePasswordHash(newPasswordHash, now)
      verificationToken.markAsUsed(now, email, VerificationTokenPurpose.resetPassword())

      const domainEvent = this.authDomainEventFactory.createPasswordResetEvent(
        user.id,
        user.email,
        deviceLocation,
        deviceInfo,
        userIpHash,
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

    const emailResult = EmailAddress.safeCreate(request.email)

    if (!emailResult.success) {
      inputErrors.push(ResetUserPasswordError.validationError('email', emailResult.error.message))
    }

    const tokenResult = VerificationTokenValue.safeCreate(request.token)
    if (!tokenResult.success) {
      inputErrors.push(ResetUserPasswordError.validationError('token', tokenResult.error.message))
    }

    const passwordResult = UserPassword.safeCreate(request.password)
    if (!passwordResult.success) {
      inputErrors.push(ResetUserPasswordError.validationError('password', passwordResult.error.message))
    }

    if (!emailResult.success || !tokenResult.success || !passwordResult.success) {
      return fail(ResetUserPasswordApplicationError.invalidInput(inputErrors))
    }

    return success({
      email: emailResult.value,
      tokenValue: tokenResult.value,
      password: passwordResult.value,
    })
  }

  private handleDomainError(
    exception: VerificationTokenDomainException,
    verificationToken: VerificationToken,
    requestEmail: EmailAddress,
  ): Result<void, ResetUserPasswordApplicationError> {
    const tokenState = {
      verificationTokenId: verificationToken.id.value,
      email: verificationToken.email.value,
      expiresAt: verificationToken.expiresAt,
      usedAt: verificationToken.usedAt,
      purpose: verificationToken.purpose.value,
      error: exception.message,
    }

    const exceptionId = exception.id
    const domainMessage = exception.message

    switch (exceptionId) {
      case VerificationTokenDomainException.verificationTokenAlreadyExpiredId: {
        this.loggerService.warn('Verification token validation failed', {
          ...tokenState,
          reason: 'Token has already expired',
        })
        return fail(ResetUserPasswordApplicationError.tokenExpired(domainMessage))
      }

      case VerificationTokenDomainException.verificationTokenAlreadyUsedId: {
        this.loggerService.warn('Verification token validation failed', {
          ...tokenState,
          reason: 'Token was already used',
        })
        return fail(ResetUserPasswordApplicationError.tokenAlreadyUsed(domainMessage))
      }

      case VerificationTokenDomainException.verificationTokenCannotBeUsedByUserId: {
        this.loggerService.warn('Verification token validation failed', {
          ...tokenState,
          reason: 'Token belongs to a different email address',
          requestEmail: requestEmail.value,
        })
        return fail(ResetUserPasswordApplicationError.tokenInvalidOwner(domainMessage))
      }

      case VerificationTokenDomainException.verificationTokenCannotBeUsedForPurposeId: {
        this.loggerService.warn('Verification token validation failed', {
          ...tokenState,
          reason: 'Token was not generated for password reset',
        })
        return fail(ResetUserPasswordApplicationError.tokenPurposeMismatch(domainMessage))
      }

      default: {
        throw exception
      }
    }
  }
}
