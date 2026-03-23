import { User } from '~/src/modules/User/Domain/User'
import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { OwnerProfile } from '~/src/modules/User/Domain/Profile/OwnerProfile'
import { PasswordHash } from '~/src/modules/Auth/Domain/ValueObject/PasswordHash'
import { UserPassword } from '~/src/modules/Auth/Domain/ValueObject/UserPassword'
import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { SportsmanProfile } from '~/src/modules/User/Domain/Profile/SportsmanProfile'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { VerificationTokenValue } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenValue'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { ProfileRepositoryInterface } from '~/src/modules/User/Domain/Profile/ProfileRepositoryInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { CreateUserApplicationRequestDto } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationRequestDto'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { VerificationTokenRepositoryInterface } from '~/src/modules/Auth/Domain/VerificationTokenRepositoryInterface'
import { CreateUserApplicationError, CreateUserError } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationError'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'

type ValidatedCreateUserInput = {
  email: EmailAddress
  tokenValue: VerificationTokenValue
  username: UserUsername
  name: UserName
  password: UserPassword
  userRole: UserRole
}

export class CreateUser {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly credentialRepository: UserCredentialRepositoryInterface,
    private readonly profileRepository: ProfileRepositoryInterface,
    private readonly verificationTokenRepository: VerificationTokenRepositoryInterface,
    private readonly domainEventRepository: DomainEventRepositoryInterface,
    private readonly verifyTokenService: VerifyTokenService,
    private readonly hasherService: HasherServiceInterface,
    private readonly clockService: ClockServiceInterface,
    private readonly unitOfWork: UnitOfWork,
    private readonly loggerService: LoggerServiceInterface,
    private readonly idGeneratorService: IdGeneratorServiceInterface,
    private readonly authDomainEventFactory: AuthDomainEventFactory,
  ) {}

  public async execute(request: CreateUserApplicationRequestDto): Promise<Result<void, CreateUserApplicationError>> {
    const now = this.clockService.now()

    const inputValidationResult = this.validateInput(request)
    if (!inputValidationResult.success) {
      return inputValidationResult
    }

    const { email, password, username, name, userRole, tokenValue } = inputValidationResult.value

    const { userAgent, userIpHash, deviceLocation } = request.clientMetadata

    const passwordHashString = await this.hasherService.hash(password.value)
    const passwordHash = PasswordHash.fromString(passwordHashString)

    return this.unitOfWork.runInTransaction(async (context: TxContext) => {
      const verificationToken = await this.verificationTokenRepository.findByEmailWithLock(email.value, context)

      if (!verificationToken) {
        return fail(CreateUserApplicationError.notFound(CreateUserError.tokenNotFound()))
      }

      const createAccountVerificationTokenPurpose = VerificationTokenPurpose.createAccount()
      const validateTokenResult = verificationToken.validate(now, email, createAccountVerificationTokenPurpose)

      if (!validateTokenResult.success) {
        return this.handleDomainError(validateTokenResult.error, verificationToken, email)
      }

      const isCryptoValid = await this.verifyTokenService.verify(verificationToken, tokenValue.value)

      if (!isCryptoValid) {
        this.loggerService.warn('Token cryptography verification failed', {
          email: verificationToken.email.value,
          verificationTokenId: verificationToken.id.value,
          purpose: createAccountVerificationTokenPurpose,
        })

        return fail(CreateUserApplicationError.invalidToken(CreateUserError.invalidToken()))
      }

      const [emailExists, usernameExists] = await Promise.all([
        await this.userRepository.checkEmailExists(email, context),
        await this.userRepository.checkUsernameExists(username, context),
      ])

      if (emailExists || usernameExists) {
        this.loggerService.warn('Signup rejected', {
          email: email.value,
          username: username.value,
          reason: 'User is already registered',
          emailExists,
          usernameExists,
        })

        const errors: Array<CreateUserError> = []

        if (emailExists) {
          errors.push(CreateUserError.duplicatedEmail())
        }
        if (usernameExists) {
          errors.push(CreateUserError.duplicatedUsername())
        }

        return fail(CreateUserApplicationError.duplicated(errors))
      }

      const userId = Identifier.fromString(this.idGeneratorService.generateId())
      const user = User.create(userId, email, username, name, userRole, now)

      const userCredential = UserCredential.create(userId, passwordHash, now)

      const sportsmanProfileId = Identifier.fromString(this.idGeneratorService.generateId())
      const sportsmanProfile = SportsmanProfile.create(sportsmanProfileId, userId, now)

      let ownerProfile: OwnerProfile | null = null
      if (userRole.equals(UserRole.owner())) {
        const ownerProfileId = Identifier.fromString(this.idGeneratorService.generateId())
        ownerProfile = OwnerProfile.create(ownerProfileId, userId, now)
      }

      const domainEvent = this.authDomainEventFactory.createSuccessfulSignupEvent(
        user.id,
        user.email,
        deviceLocation,
        userAgent,
        userIpHash,
        now,
      )

      verificationToken.markAsUsed(now, email, VerificationTokenPurpose.createAccount())

      await this.userRepository.save(user, context)
      await this.credentialRepository.save(userCredential, context)
      await this.profileRepository.saveSportsmanProfile(sportsmanProfile, context)

      if (ownerProfile) {
        await this.profileRepository.saveOwnerProfile(ownerProfile, context)
      }

      await this.verificationTokenRepository.update(verificationToken, context)
      await this.domainEventRepository.save(domainEvent, context)

      return success(undefined)
    })
  }

  private validateInput(request: CreateUserApplicationRequestDto): Result<ValidatedCreateUserInput, CreateUserApplicationError> {
    const inputErrors: CreateUserError[] = []

    const emailResult = EmailAddress.safeCreate(request.email)

    if (!emailResult.success) {
      inputErrors.push(CreateUserError.invalidEmail(emailResult.error.message))
    }

    const tokenResult = VerificationTokenValue.safeCreate(request.token)
    if (!tokenResult.success) {
      inputErrors.push(CreateUserError.invalidTokenFormat(tokenResult.error.message))
    }

    const usernameResult = UserUsername.safeCreate(request.username)
    if (!usernameResult.success) {
      inputErrors.push(CreateUserError.invalidUsername(usernameResult.error.message))
    }

    const nameResult = UserName.safeCreate(request.name)
    if (!nameResult.success) {
      inputErrors.push(CreateUserError.invalidName(nameResult.error.message))
    }

    const passwordResult = UserPassword.safeCreate(request.password)
    if (!passwordResult.success) {
      inputErrors.push(CreateUserError.invalidPassword(passwordResult.error.message))
    }

    const roleResult = UserRole.safeCreate(request.requestedRole)
    if (!roleResult.success) {
      inputErrors.push(CreateUserError.invalidRole(roleResult.error.message))
    }

    if (
      !emailResult.success ||
      !tokenResult.success ||
      !usernameResult.success ||
      !nameResult.success ||
      !passwordResult.success ||
      !roleResult.success
    ) {
      return fail(CreateUserApplicationError.invalidInput(inputErrors))
    }

    return success({
      email: emailResult.value,
      tokenValue: tokenResult.value,
      username: usernameResult.value,
      name: nameResult.value,
      password: passwordResult.value,
      userRole: roleResult.value,
    })
  }

  private handleDomainError(
    exception: VerificationTokenDomainException,
    verificationToken: VerificationToken,
    requestEmail: EmailAddress,
  ): Result<void, CreateUserApplicationError> {
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
        return fail(CreateUserApplicationError.invalidToken(CreateUserError.tokenExpired(domainMessage)))
      }

      case VerificationTokenDomainException.verificationTokenAlreadyUsedId: {
        this.loggerService.warn('Verification token validation failed', {
          ...tokenState,
          reason: 'Token was already used',
        })
        return fail(CreateUserApplicationError.invalidToken(CreateUserError.tokenAlreadyUsed(domainMessage)))
      }

      case VerificationTokenDomainException.verificationTokenCannotBeUsedByUserId: {
        this.loggerService.warn('Verification token validation failed', {
          ...tokenState,
          reason: 'Token belongs to a different email address',
          requestEmail: requestEmail.value,
        })
        return fail(CreateUserApplicationError.invalidToken(CreateUserError.tokenInvalidOwner(domainMessage)))
      }

      case VerificationTokenDomainException.verificationTokenCannotBeUsedForPurposeId: {
        this.loggerService.warn('Verification token validation failed', {
          ...tokenState,
          reason: 'Token was not generated for signup',
        })
        return fail(CreateUserApplicationError.invalidToken(CreateUserError.tokenPurposeMismatch(domainMessage)))
      }

      default:
        throw exception
    }
  }
}
