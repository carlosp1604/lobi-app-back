import { Module } from '@nestjs/common'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { LOGGER_FACTORY } from '~/src/modules/Shared/Infrastructure/logger.module'
import { AuthController } from '~/src/modules/Auth/Infrastructure/auth.controller'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import {
  CREATE_USER,
  DEVICE_LOCATION_RESOLVER,
  DOMAIN_EVENT_REPOSITORY,
  EMAIL_SENDER_SERVICE,
  GENERATE_TOKENS_SERVICE,
  GENERATE_VERIFICATION_TOKEN,
  HASHER_SERVICE,
  IP_VALIDATOR,
  LOGIN_USER,
  LOGOUT_USER,
  MAX_SESSIONS_POLICY,
  PASSWORD_HASHER_SERVICE,
  USER_PROFILE_REPOSITORY,
  RANDOM_SERVICE,
  REFRESH_SESSION,
  REQUEST_ORIGIN_SERVICE,
  TOKEN_GENERATOR,
  USER_CREDENTIAL_REPOSITORY,
  USER_REPOSITORY,
  USER_SESSION_POLICY_MANAGER_SERVICE,
  USER_SESSION_REPOSITORY,
  VALIDATE_VERIFICATION_TOKEN,
  VERIFICATION_TOKEN_REPOSITORY,
  VERIFY_TOKEN_DOMAIN_SERVICE,
  RESET_USER_PASSWORD,
  AUTH_DOMAIN_EVENT_FACTORY,
  GET_ACTIVE_SESSIONS,
} from '~/src/modules/Auth/Infrastructure/auth.tokens'
import { PostgreSqlUserCredentialRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserCredentialRepository'
import { PostgreSqlUserSessionRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserSessionRepository'
import { PostgreSqlDomainEventRepository } from '~/src/modules/Shared/Infrastructure/PostgreSqlDomainEventRepository'
import { BCryptHasherService } from '~/src/modules/Auth/Infrastructure/Services/BCryptHasherService'
import { JWTokenGeneratorApplicationService } from '~/src/modules/Auth/Infrastructure/Services/JWTokenGeneratorApplicationService'
import { HmacHasherService } from '~/src/modules/Auth/Infrastructure/Services/HmacHasherService'
import { NoopDeviceLocationResolverService } from '~/src/modules/Auth/Infrastructure/Services/NoopDeviceLocationResolverService'
import { IpAddressIpValidatorService } from '~/src/modules/Auth/Infrastructure/Services/IpAddressIpValidatorService'
import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { TokenGeneratorApplicationServiceInterface } from '~/src/modules/Auth/Application/TokenGenerator/TokenGeneratorApplicationServiceInterface'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { DeviceLocationResolverServiceInterface } from '~/src/modules/Auth/Domain/DeviceLocationResolverServiceInterface'
import { NodeClockService } from '~/src/modules/Shared/Infrastructure/Services/NodeClockService'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { IpValidatorServiceInterface } from '~/src/modules/Auth/Domain/IpValidatorServiceInterface'
import { LoginUser } from '~/src/modules/Auth/Application/LoginUser/LoginUser'
import { CLOCK_SERVICE, ID_GENERATOR } from '~/src/modules/Shared/Infrastructure/shared.tokens'
import { TYPEORM_MANAGER_RESOLVER, UNIT_OF_WORK } from '~/src/db/config/typeorm.tokens'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { UserSessionEntity } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { UserCredentialEntity } from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'
import { DomainEventEntity } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { UserSessionPolicyManagerApplicationService } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationService'
import { RefreshSession } from '~/src/modules/Auth/Application/RefreshSession/RefreshSession'
import { PostgreSqlVerificationTokenRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlVerificationTokenRepository'
import { NodeRandomService } from '~/src/modules/Shared/Infrastructure/Services/NodeRandomService'
import { PostmarkEmailSenderService } from '~/src/modules/Shared/Infrastructure/Services/PostmarkEmailSenderService'
import { ServerClient } from 'postmark'
import { VerificationTokenRepositoryInterface } from '~/src/modules/Auth/Domain/VerificationTokenRepositoryInterface'
import { EmailSenderServiceInterface } from '~/src/modules/Shared/Domain/EmailSenderServiceInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { RandomServiceInterface } from '~/src/modules/Shared/Domain/RandomServiceInterface'
import { GenerateVerificationToken } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationToken'
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { VerificationTokenEntity } from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'
import { ValidateVerificationToken } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationToken'
import { PostgreSqlProfileRepository } from '~/src/modules/User/Infrastructure/Profile/PostgreSqlProfileRepository'
import { ProfileRepositoryInterface } from '~/src/modules/User/Domain/Profile/ProfileRepositoryInterface'
import { CreateUser } from '~/src/modules/Auth/Application/CreateUser/CreateUser'
import { SportsmanProfileEntity } from '~/src/modules/User/Infrastructure/Entities/Profiles/sportsman-profile.entity'
import { OwnerProfileEntity } from '~/src/modules/User/Infrastructure/Entities/Profiles/owner-profile.entity'
import { ResetUserPassword } from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPassword'
import { LoggerFactoryInterface } from '~/src/modules/Shared/Domain/LoggerFactoryInterface'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { LogoutUser } from '~/src/modules/Auth/Application/LogoutUser/LogoutUser'
import { GetActiveSessions } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessions'

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      UserEntity,
      UserSessionEntity,
      UserCredentialEntity,
      DomainEventEntity,
      VerificationTokenEntity,
      SportsmanProfileEntity,
      OwnerProfileEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useFactory: (managerResolver: TypeOrmManagerResolver) => {
        return new PostgresqlUserRepository(managerResolver)
      },
      inject: [TYPEORM_MANAGER_RESOLVER],
    },
    {
      provide: USER_PROFILE_REPOSITORY,
      useFactory: (managerResolver: TypeOrmManagerResolver) => {
        return new PostgreSqlProfileRepository(managerResolver)
      },
      inject: [TYPEORM_MANAGER_RESOLVER],
    },
    {
      provide: USER_CREDENTIAL_REPOSITORY,
      useFactory: (managerResolver: TypeOrmManagerResolver) => {
        return new PostgreSqlUserCredentialRepository(managerResolver)
      },
      inject: [TYPEORM_MANAGER_RESOLVER],
    },
    {
      provide: USER_SESSION_REPOSITORY,
      useFactory: (managerResolver: TypeOrmManagerResolver) => {
        return new PostgreSqlUserSessionRepository(managerResolver)
      },
      inject: [TYPEORM_MANAGER_RESOLVER],
    },
    {
      provide: DOMAIN_EVENT_REPOSITORY,
      useFactory: (managerResolver: TypeOrmManagerResolver) => {
        return new PostgreSqlDomainEventRepository(managerResolver)
      },
      inject: [TYPEORM_MANAGER_RESOLVER],
    },
    {
      provide: VERIFICATION_TOKEN_REPOSITORY,
      useFactory: (managerResolver: TypeOrmManagerResolver) => {
        return new PostgreSqlVerificationTokenRepository(managerResolver)
      },
      inject: [TYPEORM_MANAGER_RESOLVER],
    },
    {
      provide: PASSWORD_HASHER_SERVICE,
      useFactory: (configService: ConfigService<Env, true>) => {
        return new BCryptHasherService(configService.get('SALT_ROUNDS', { infer: true }))
      },
      inject: [ConfigService],
    },
    {
      provide: TOKEN_GENERATOR,
      useFactory: (configService: ConfigService<Env, true>) => {
        return new JWTokenGeneratorApplicationService(
          configService.get('ACCESS_SECRET', { infer: true }),
          configService.get('ACCESS_ISSUER', { infer: true }),
          configService.get('ACCESS_AUDIENCE', { infer: true }),
        )
      },
      inject: [ConfigService],
    },
    {
      provide: HASHER_SERVICE,
      useFactory: (configService: ConfigService<Env, true>) => {
        return new HmacHasherService(configService.get('HASH_SECRET', { infer: true }))
      },
      inject: [ConfigService],
    },
    { provide: DEVICE_LOCATION_RESOLVER, useClass: NoopDeviceLocationResolverService },
    { provide: IP_VALIDATOR, useClass: IpAddressIpValidatorService },
    {
      provide: MAX_SESSIONS_POLICY,
      useFactory: (configService: ConfigService<Env, true>) => {
        return new MaxSessionsPolicy(configService.get('USER_MAX_SESSIONS', { infer: true }))
      },
      inject: [ConfigService],
    },
    {
      provide: GENERATE_TOKENS_SERVICE,
      useFactory: (
        idGeneratorService: IdGeneratorServiceInterface,
        tokenGenerator: TokenGeneratorApplicationServiceInterface,
        hasherService: HasherServiceInterface,
        configService: ConfigService<Env, true>,
      ) => {
        return new GenerateTokensApplicationService(idGeneratorService, tokenGenerator, hasherService, configService)
      },
      inject: [ID_GENERATOR, TOKEN_GENERATOR, HASHER_SERVICE, ConfigService],
    },
    {
      provide: USER_SESSION_POLICY_MANAGER_SERVICE,
      useFactory: (maxSessionsPolicy: MaxSessionsPolicy, loggerFactory: LoggerFactoryInterface) => {
        return new UserSessionPolicyManagerApplicationService(
          maxSessionsPolicy,
          loggerFactory.createLogger(UserSessionPolicyManagerApplicationService.name),
        )
      },
      inject: [MAX_SESSIONS_POLICY, LOGGER_FACTORY],
    },
    {
      provide: RANDOM_SERVICE,
      useClass: NodeRandomService,
    },
    {
      provide: EMAIL_SENDER_SERVICE,
      useFactory: (configService: ConfigService<Env, true>, loggerFactory: LoggerFactoryInterface) => {
        return new PostmarkEmailSenderService(
          new ServerClient(configService.get('EMAIL_API_TOKEN', { infer: true })),
          configService.get('EMAIL_FROM_ADDRESS', { infer: true }),
          configService.get('EMAIL_COMPANY_NAME', { infer: true }),
          configService.get('EMAIL_APP_NAME', { infer: true }),
          loggerFactory.createLogger(PostmarkEmailSenderService.name),
        )
      },
      inject: [ConfigService, LOGGER_FACTORY],
    },
    {
      provide: REQUEST_ORIGIN_SERVICE,
      useFactory: (
        ipValidator: IpValidatorServiceInterface,
        hasherService: HasherServiceInterface,
        deviceLocationResolver: DeviceLocationResolverServiceInterface,
        loggerFactory: LoggerFactoryInterface,
      ) => {
        return new RequestOriginApplicationService(
          ipValidator,
          hasherService,
          deviceLocationResolver,
          loggerFactory.createLogger(RequestOriginApplicationService.name),
        )
      },
      inject: [IP_VALIDATOR, HASHER_SERVICE, DEVICE_LOCATION_RESOLVER, LOGGER_FACTORY],
    },
    {
      provide: VERIFY_TOKEN_DOMAIN_SERVICE,
      useFactory: (hasherService: HasherServiceInterface) => {
        return new VerifyTokenService(hasherService)
      },
      inject: [PASSWORD_HASHER_SERVICE],
    },
    {
      provide: AUTH_DOMAIN_EVENT_FACTORY,
      useFactory: (idGeneratorService: IdGeneratorServiceInterface) => {
        return new AuthDomainEventFactory(idGeneratorService)
      },
      inject: [ID_GENERATOR],
    },
    {
      provide: LOGIN_USER,
      useFactory: (
        userRepository: UserRepositoryInterface,
        credentialRepository: UserCredentialRepositoryInterface,
        sessionRepository: UserSessionRepositoryInterface,
        domainEventRepository: DomainEventRepositoryInterface,
        hasherService: HasherServiceInterface,
        generateTokensService: GenerateTokensApplicationService,
        userSessionManagerService: UserSessionPolicyManagerApplicationService,
        requestOriginApplicationService: RequestOriginApplicationService,
        clockService: NodeClockService,
        unitOfWork: UnitOfWork,
        loggerFactory: LoggerFactoryInterface,
        authDomainEventFactory: AuthDomainEventFactory,
      ) =>
        new LoginUser(
          userRepository,
          credentialRepository,
          sessionRepository,
          domainEventRepository,
          hasherService,
          generateTokensService,
          userSessionManagerService,
          requestOriginApplicationService,
          clockService,
          unitOfWork,
          loggerFactory.createLogger(LoginUser.name),
          authDomainEventFactory,
        ),
      inject: [
        USER_REPOSITORY,
        USER_CREDENTIAL_REPOSITORY,
        USER_SESSION_REPOSITORY,
        DOMAIN_EVENT_REPOSITORY,
        PASSWORD_HASHER_SERVICE,
        GENERATE_TOKENS_SERVICE,
        USER_SESSION_POLICY_MANAGER_SERVICE,
        REQUEST_ORIGIN_SERVICE,
        CLOCK_SERVICE,
        UNIT_OF_WORK,
        LOGGER_FACTORY,
        AUTH_DOMAIN_EVENT_FACTORY,
      ],
    },
    {
      provide: REFRESH_SESSION,
      useFactory: (
        userRepository: UserRepositoryInterface,
        sessionRepository: UserSessionRepositoryInterface,
        hasherService: HasherServiceInterface,
        generateTokensService: GenerateTokensApplicationService,
        userSessionManagerService: UserSessionPolicyManagerApplicationService,
        requestOriginApplicationService: RequestOriginApplicationService,
        clockService: NodeClockService,
        unitOfWork: UnitOfWork,
        loggerFactory: LoggerFactoryInterface,
      ) => {
        return new RefreshSession(
          userRepository,
          sessionRepository,
          hasherService,
          generateTokensService,
          userSessionManagerService,
          requestOriginApplicationService,
          clockService,
          unitOfWork,
          loggerFactory.createLogger(RefreshSession.name),
        )
      },
      inject: [
        USER_REPOSITORY,
        USER_SESSION_REPOSITORY,
        HASHER_SERVICE,
        GENERATE_TOKENS_SERVICE,
        USER_SESSION_POLICY_MANAGER_SERVICE,
        REQUEST_ORIGIN_SERVICE,
        CLOCK_SERVICE,
        UNIT_OF_WORK,
        LOGGER_FACTORY,
      ],
    },
    {
      provide: GENERATE_VERIFICATION_TOKEN,
      useFactory: (
        verificationTokenRepository: VerificationTokenRepositoryInterface,
        userRepository: UserRepositoryInterface,
        domainEventRepository: DomainEventRepositoryInterface,
        emailSenderService: EmailSenderServiceInterface,
        unitOfWork: UnitOfWork,
        hasherService: HasherServiceInterface,
        requestOriginApplicationService: RequestOriginApplicationService,
        clockService: ClockServiceInterface,
        randomService: RandomServiceInterface,
        configService: ConfigService<Env, true>,
        loggerFactory: LoggerFactoryInterface,
        idGeneratorService: IdGeneratorServiceInterface,
        authDomainEventFactory: AuthDomainEventFactory,
      ) => {
        return new GenerateVerificationToken(
          verificationTokenRepository,
          userRepository,
          domainEventRepository,
          emailSenderService,
          unitOfWork,
          hasherService,
          requestOriginApplicationService,
          clockService,
          randomService,
          configService,
          loggerFactory.createLogger(GenerateVerificationToken.name),
          idGeneratorService,
          authDomainEventFactory,
        )
      },
      inject: [
        VERIFICATION_TOKEN_REPOSITORY,
        USER_REPOSITORY,
        DOMAIN_EVENT_REPOSITORY,
        EMAIL_SENDER_SERVICE,
        UNIT_OF_WORK,
        PASSWORD_HASHER_SERVICE,
        REQUEST_ORIGIN_SERVICE,
        CLOCK_SERVICE,
        RANDOM_SERVICE,
        ConfigService,
        LOGGER_FACTORY,
        ID_GENERATOR,
        AUTH_DOMAIN_EVENT_FACTORY,
      ],
    },
    {
      provide: VALIDATE_VERIFICATION_TOKEN,
      useFactory: (
        verificationTokenRepository: VerificationTokenRepositoryInterface,
        verifyTokenService: VerifyTokenService,
        clockService: ClockServiceInterface,
        loggerFactory: LoggerFactoryInterface,
      ) => {
        return new ValidateVerificationToken(
          verificationTokenRepository,
          verifyTokenService,
          clockService,
          loggerFactory.createLogger(ValidateVerificationToken.name),
        )
      },
      inject: [VERIFICATION_TOKEN_REPOSITORY, VERIFY_TOKEN_DOMAIN_SERVICE, CLOCK_SERVICE, LOGGER_FACTORY],
    },
    {
      provide: CREATE_USER,
      useFactory: (
        userRepository: UserRepositoryInterface,
        credentialRepository: UserCredentialRepositoryInterface,
        profileRepository: ProfileRepositoryInterface,
        verificationTokenRepository: VerificationTokenRepositoryInterface,
        domainEventRepository: DomainEventRepositoryInterface,
        verifyTokenService: VerifyTokenService,
        hasherService: HasherServiceInterface,
        requestOriginApplicationService: RequestOriginApplicationService,
        clockService: NodeClockService,
        unitOfWork: UnitOfWork,
        loggerFactory: LoggerFactoryInterface,
        idGeneratorService: IdGeneratorServiceInterface,
        authDomainEventFactory: AuthDomainEventFactory,
      ) =>
        new CreateUser(
          userRepository,
          credentialRepository,
          profileRepository,
          verificationTokenRepository,
          domainEventRepository,
          verifyTokenService,
          hasherService,
          requestOriginApplicationService,
          clockService,
          unitOfWork,
          loggerFactory.createLogger(CreateUser.name),
          idGeneratorService,
          authDomainEventFactory,
        ),
      inject: [
        USER_REPOSITORY,
        USER_CREDENTIAL_REPOSITORY,
        USER_PROFILE_REPOSITORY,
        VERIFICATION_TOKEN_REPOSITORY,
        DOMAIN_EVENT_REPOSITORY,
        VERIFY_TOKEN_DOMAIN_SERVICE,
        PASSWORD_HASHER_SERVICE,
        REQUEST_ORIGIN_SERVICE,
        CLOCK_SERVICE,
        UNIT_OF_WORK,
        LOGGER_FACTORY,
        ID_GENERATOR,
        AUTH_DOMAIN_EVENT_FACTORY,
      ],
    },
    {
      provide: RESET_USER_PASSWORD,
      useFactory: (
        userRepository: UserRepositoryInterface,
        credentialRepository: UserCredentialRepositoryInterface,
        verificationTokenRepository: VerificationTokenRepositoryInterface,
        domainEventRepository: DomainEventRepositoryInterface,
        verifyTokenService: VerifyTokenService,
        hasherService: HasherServiceInterface,
        requestOriginApplicationService: RequestOriginApplicationService,
        clockService: NodeClockService,
        unitOfWork: UnitOfWork,
        loggerFactory: LoggerFactoryInterface,
        authDomainEventFactory: AuthDomainEventFactory,
      ) =>
        new ResetUserPassword(
          userRepository,
          credentialRepository,
          verificationTokenRepository,
          domainEventRepository,
          verifyTokenService,
          hasherService,
          requestOriginApplicationService,
          clockService,
          unitOfWork,
          loggerFactory.createLogger(ResetUserPassword.name),
          authDomainEventFactory,
        ),
      inject: [
        USER_REPOSITORY,
        USER_CREDENTIAL_REPOSITORY,
        VERIFICATION_TOKEN_REPOSITORY,
        DOMAIN_EVENT_REPOSITORY,
        VERIFY_TOKEN_DOMAIN_SERVICE,
        PASSWORD_HASHER_SERVICE,
        REQUEST_ORIGIN_SERVICE,
        CLOCK_SERVICE,
        UNIT_OF_WORK,
        LOGGER_FACTORY,
        AUTH_DOMAIN_EVENT_FACTORY,
      ],
    },
    {
      provide: LOGOUT_USER,
      useFactory: (
        userRepository: UserRepositoryInterface,
        sessionRepository: UserSessionRepositoryInterface,
        clockService: ClockServiceInterface,
        unitOfWork: UnitOfWork,
        loggerFactory: LoggerFactoryInterface,
      ) => {
        return new LogoutUser(userRepository, sessionRepository, clockService, unitOfWork, loggerFactory.createLogger(LogoutUser.name))
      },
      inject: [USER_REPOSITORY, USER_SESSION_REPOSITORY, CLOCK_SERVICE, UNIT_OF_WORK, LOGGER_FACTORY],
    },
    {
      provide: GET_ACTIVE_SESSIONS,
      useFactory: (
        sessionRepository: UserSessionRepositoryInterface,
        clockService: ClockServiceInterface,
        loggerFactory: LoggerFactoryInterface,
      ) => {
        return new GetActiveSessions(sessionRepository, clockService, loggerFactory.createLogger(GetActiveSessions.name))
      },
      inject: [USER_SESSION_REPOSITORY, CLOCK_SERVICE, LOGGER_FACTORY],
    },
  ],
  exports: [
    LOGIN_USER,
    REFRESH_SESSION,
    GENERATE_VERIFICATION_TOKEN,
    VALIDATE_VERIFICATION_TOKEN,
    CREATE_USER,
    RESET_USER_PASSWORD,
    LOGOUT_USER,
    GET_ACTIVE_SESSIONS,
    TypeOrmModule,
  ],
})
export class AuthModule {}
