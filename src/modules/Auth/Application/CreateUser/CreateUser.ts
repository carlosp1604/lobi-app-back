import { User } from '~/src/modules/User/Domain/User'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { OwnerProfile } from '~/src/modules/User/Domain/Profile/OwnerProfile'
import { PasswordHash } from '~/src/modules/Auth/Domain/ValueObject/PasswordHash'
import { UserPassword } from '~/src/modules/Auth/Domain/ValueObject/UserPassword'
import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'
import { DomainEventId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventId'
import { UserProfileId } from '~/src/modules/User/Domain/ValueObject/Profile/UserProfileId'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { SportsmanProfile } from '~/src/modules/User/Domain/Profile/SportsmanProfile'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { VerificationTokenEmail } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenEmail'
import { VerificationTokenValue } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenValue'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { ProfileRepositoryInterface } from '~/src/modules/User/Domain/Profile/ProfileRepositoryInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { CreateUserApplicationRequestDto } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationRequestDto'
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { VerificationTokenRepositoryInterface } from '~/src/modules/Auth/Domain/VerificationTokenRepositoryInterface'
import { CreateUserApplicationError, CreateUserError } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationError'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'

type ValidatedCreateUserInput = {
  userEmail: UserEmail
  verificationTokenEmail: VerificationTokenEmail
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
    private readonly requestOriginApplicationService: RequestOriginApplicationService,
    private readonly clockService: ClockServiceInterface,
    private readonly unitOfWork: UnitOfWork,
    private readonly loggerService: LoggerServiceInterface,
    private readonly idGeneratorService: IdGeneratorServiceInterface,
  ) {}

  public async execute(request: CreateUserApplicationRequestDto): Promise<Result<void, CreateUserApplicationError>> {
    const now = this.clockService.now()

    const inputValidationResult = this.validateInput(request)
    if (!inputValidationResult.success) {
      return inputValidationResult
    }

    const { userEmail, verificationTokenEmail, password, username, name, userRole, tokenValue } = inputValidationResult.value

    const { userAgent, ipHash, deviceLocation } = await this.requestOriginApplicationService.process(request.ip, request.userAgent, {
      email: userEmail.value,
    })

    const passwordHashString = await this.hasherService.hash(password.value)
    const passwordHash = PasswordHash.fromString(passwordHashString)

    return this.unitOfWork.runInTransaction(async (context: TxContext) => {
      const verificationToken = await this.verificationTokenRepository.findByEmailWithLock(verificationTokenEmail.value, context)

      if (!verificationToken) {
        return fail(CreateUserApplicationError.notFound(CreateUserError.tokenNotFound(verificationTokenEmail.value)))
      }

      const validateVerificationTokenResult = verificationToken.validate(
        now,
        verificationTokenEmail,
        VerificationTokenPurpose.createAccount(),
      )

      if (!validateVerificationTokenResult.success) {
        return this.handleDomainError(validateVerificationTokenResult.error, verificationToken, userEmail)
      }

      const isCryptoValid = await this.verifyTokenService.verify(verificationToken, tokenValue.value)

      if (!isCryptoValid) {
        this.loggerService.warn('Verification token cryptography verification failed', {
          email: userEmail.value,
        })

        return fail(CreateUserApplicationError.invalidToken(CreateUserError.invalidToken()))
      }

      const [emailExists, usernameExists] = await Promise.all([
        await this.userRepository.checkEmailExists(userEmail, context),
        await this.userRepository.checkUsernameExists(username, context),
      ])

      if (emailExists || usernameExists) {
        this.loggerService.warn('Signup attempt with existing credentials', {
          email: userEmail.value,
          username: username.value,
          emailExists,
          usernameExists,
        })

        const errors: Array<CreateUserError> = []

        if (emailExists) {
          errors.push(CreateUserError.duplicatedEmail(userEmail.value))
        }
        if (usernameExists) {
          errors.push(CreateUserError.duplicatedUsername(username.value))
        }

        return fail(CreateUserApplicationError.duplicated(errors))
      }

      const userId = UserId.fromString(this.idGeneratorService.generateId())
      const user = User.create(userId, userEmail, username, name, userRole, now)

      const userCredential = UserCredential.create(userId, passwordHash, now)

      const sportsmanProfileId = UserProfileId.fromString(this.idGeneratorService.generateId())
      const sportsmanProfile = SportsmanProfile.create(sportsmanProfileId, userId, now)

      let ownerProfile: OwnerProfile | null = null
      if (userRole.equals(UserRole.owner())) {
        const ownerProfileId = UserProfileId.fromString(this.idGeneratorService.generateId())
        ownerProfile = OwnerProfile.create(ownerProfileId, userId, now)
      }

      const domainEvent = this.buildSuccessfulSignupDomainEvent(user, deviceLocation, userAgent, ipHash, now)

      verificationToken.markAsUsed(now, verificationTokenEmail, VerificationTokenPurpose.createAccount())

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

    const userEmailResult = UserEmail.safeCreate(request.email)

    if (!userEmailResult.success) {
      inputErrors.push(CreateUserError.invalidEmail())
    }

    const tokenResult = VerificationTokenValue.safeCreate(request.token)
    if (!tokenResult.success) {
      inputErrors.push(CreateUserError.invalidTokenFormat())
    }

    const usernameResult = UserUsername.safeCreate(request.username)
    if (!usernameResult.success) {
      inputErrors.push(CreateUserError.invalidUsername())
    }

    const nameResult = UserName.safeCreate(request.name)
    if (!nameResult.success) {
      inputErrors.push(CreateUserError.invalidName())
    }

    const passwordResult = UserPassword.safeCreate(request.password)
    if (!passwordResult.success) {
      inputErrors.push(CreateUserError.invalidPassword())
    }

    const roleResult = UserRole.safeCreate(request.requestedRole)
    if (!roleResult.success) {
      inputErrors.push(CreateUserError.invalidRole())
    }

    if (
      !userEmailResult.success ||
      !tokenResult.success ||
      !usernameResult.success ||
      !nameResult.success ||
      !passwordResult.success ||
      !roleResult.success
    ) {
      return fail(CreateUserApplicationError.invalidInput(inputErrors))
    }

    const verificationTokenEmail = VerificationTokenEmail.fromString(userEmailResult.value.value)

    return success({
      userEmail: userEmailResult.value,
      verificationTokenEmail: verificationTokenEmail,
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
    userEmail: UserEmail,
  ): Result<void, CreateUserApplicationError> {
    switch (exception.id) {
      case VerificationTokenDomainException.verificationTokenAlreadyExpiredId: {
        this.loggerService.warn('Verification token validation failed: tokenExpired', {
          message: exception.message,
          email: userEmail.value,
          verificationTokenId: verificationToken.id.value,
          expiresAt: verificationToken.expiresAt,
        })

        return fail(CreateUserApplicationError.invalidToken(CreateUserError.tokenExpired()))
      }

      case VerificationTokenDomainException.verificationTokenAlreadyUsedId: {
        this.loggerService.warn('Verification token validation failed: tokenAlreadyUsed', {
          message: exception.message,
          email: userEmail.value,
          verificationTokenId: verificationToken.id.value,
          usedAt: verificationToken.usedAt,
        })

        return fail(CreateUserApplicationError.invalidToken(CreateUserError.tokenAlreadyUsed()))
      }

      case VerificationTokenDomainException.verificationTokenCannotBeUsedByUserId: {
        this.loggerService.warn('Verification token validation failed: tokenInvalidOwner', {
          message: exception.message,
          email: userEmail.value,
          ownerEmail: verificationToken.email.value,
          verificationTokenId: verificationToken.id.value,
        })

        return fail(CreateUserApplicationError.invalidToken(CreateUserError.tokenInvalidOwner()))
      }

      case VerificationTokenDomainException.verificationTokenCannotBeUsedForPurposeId: {
        this.loggerService.warn('Verification token validation failed: tokenPurposeMismatch', {
          message: exception.message,
          email: userEmail.value,
          verificationTokenId: verificationToken.id.value,
          verificationTokenPurpose: verificationToken.purpose.value,
        })

        return fail(CreateUserApplicationError.invalidToken(CreateUserError.tokenPurposeMismatch()))
      }

      default:
        throw exception
    }
  }

  private buildSuccessfulSignupDomainEvent(
    user: User,
    deviceLocation: DeviceLocation | null,
    userAgent: UserAgent,
    ipHash: string | null,
    now: Date,
  ): DomainEvent {
    return DomainEvent.create(
      DomainEventId.fromString(this.idGeneratorService.generateId()),
      DomainEventName.successfulSignup(),
      DomainEventAggregateType.user(),
      DomainEventAggregateId.fromString(user.id.value),
      {
        userId: user.id.value,
        deviceLocation: deviceLocation
          ? {
              city: deviceLocation.city,
              countryCode: deviceLocation.countryCode,
            }
          : null,
        email: user.email.value,
      },
      {
        ipHash: ipHash,
        ua: userAgent.value,
      },
      now,
    )
  }
}
