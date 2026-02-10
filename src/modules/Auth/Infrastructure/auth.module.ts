import { Module } from '@nestjs/common'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { LOGGER_SERVICE } from '~/src/modules/Shared/Infrastructure/logger.module'
import { AuthController } from '~/src/modules/Auth/Infrastructure/auth.controller'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import {
  DEVICE_LOCATION_RESOLVER,
  DOMAIN_EVENT_REPOSITORY,
  EMAIL_SENDER_SERVICE,
  GENERATE_TOKENS_SERVICE,
  GENERATE_VERIFICATION_TOKEN,
  HASHER_SERVICE,
  IP_VALIDATOR,
  LOGIN_USER,
  MAX_SESSIONS_POLICY,
  PASSWORD_HASHER,
  RANDOM_SERVICE,
  REFRESH_SESSION,
  REQUEST_ORIGIN_SERVICE,
  TOKEN_GENERATOR,
  USER_CREDENTIAL_REPOSITORY,
  USER_REPOSITORY,
  USER_SESSION_POLICY_MANAGER_SERVICE,
  USER_SESSION_REPOSITORY,
  VERIFICATION_TOKEN_REPOSITORY,
} from '~/src/modules/Auth/Infrastructure/auth.tokens'
import { PostgreSqlUserCredentialRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserCredentialRepository'
import { PostgreSqlUserSessionRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserSessionRepository'
import { PostgreSqlDomainEventRepository } from '~/src/modules/Shared/Infrastructure/PostgreSqlDomainEventRepository'
import { BCryptPasswordHasherService } from '~/src/modules/Auth/Infrastructure/Services/BCryptPasswordHasherService'
import { JWTokenGeneratorApplicationService } from '~/src/modules/Auth/Infrastructure/Services/JWTokenGeneratorApplicationService'
import { NodeHasherService } from '~/src/modules/Auth/Infrastructure/Services/NodeHasherService'
import { NoopDeviceLocationResolverService } from '~/src/modules/Auth/Infrastructure/Services/NoopDeviceLocationResolverService'
import { IpAddressIpValidatorService } from '~/src/modules/Auth/Infrastructure/Services/IpAddressIpValidatorService'
import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { PasswordHasherServiceInterface } from '~/src/modules/Auth/Domain/PasswordHasherServiceInterface'
import { TokenGeneratorApplicationServiceInterface } from '~/src/modules/Auth/Application/TokenGenerator/TokenGeneratorApplicationServiceInterface'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { DeviceLocationResolverServiceInterface } from '~/src/modules/Auth/Domain/DeviceLocationResolverServiceInterface'
import { NodeClockService } from '~/src/modules/Shared/Infrastructure/Services/NodeClockService'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
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

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UserEntity, UserSessionEntity, UserCredentialEntity, DomainEventEntity, VerificationTokenEntity]),
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
      provide: PASSWORD_HASHER,
      useFactory: (configService: ConfigService<Env, true>) => {
        return new BCryptPasswordHasherService(configService.get('SALT_ROUNDS', { infer: true }))
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
        return new NodeHasherService(configService.get('HASH_SECRET', { infer: true }))
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
      useFactory: (maxSessionsPolicy: MaxSessionsPolicy, loggerService: LoggerServiceInterface) => {
        return new UserSessionPolicyManagerApplicationService(maxSessionsPolicy, loggerService)
      },
      inject: [MAX_SESSIONS_POLICY, LOGGER_SERVICE],
    },
    {
      provide: RANDOM_SERVICE,
      useClass: NodeRandomService,
    },
    {
      provide: EMAIL_SENDER_SERVICE,
      useFactory: (configService: ConfigService<Env, true>, loggerService: LoggerServiceInterface) => {
        return new PostmarkEmailSenderService(
          new ServerClient(configService.get('EMAIL_API_TOKEN', { infer: true })),
          configService.get('EMAIL_FROM_ADDRESS', { infer: true }),
          configService.get('EMAIL_COMPANY_NAME', { infer: true }),
          configService.get('EMAIL_APP_NAME', { infer: true }),
          loggerService,
        )
      },
      inject: [ConfigService, LOGGER_SERVICE],
    },
    {
      provide: REQUEST_ORIGIN_SERVICE,
      useFactory: (
        ipValidator: IpValidatorServiceInterface,
        hasherService: HasherServiceInterface,
        deviceLocationResolver: DeviceLocationResolverServiceInterface,
        loggerService: LoggerServiceInterface,
      ) => {
        return new RequestOriginApplicationService(ipValidator, hasherService, deviceLocationResolver, loggerService)
      },
      inject: [IP_VALIDATOR, HASHER_SERVICE, DEVICE_LOCATION_RESOLVER, LOGGER_SERVICE],
    },
    {
      provide: LOGIN_USER,
      useFactory: (
        userRepository: UserRepositoryInterface,
        credentialRepository: UserCredentialRepositoryInterface,
        sessionRepository: UserSessionRepositoryInterface,
        domainEventRepository: DomainEventRepositoryInterface,
        passwordHasher: PasswordHasherServiceInterface,
        generateTokensService: GenerateTokensApplicationService,
        userSessionManagerService: UserSessionPolicyManagerApplicationService,
        requestOriginApplicationService: RequestOriginApplicationService,
        clockService: NodeClockService,
        unitOfWork: UnitOfWork,
        loggerService: LoggerServiceInterface,
        idGeneratorService: IdGeneratorServiceInterface,
      ) =>
        new LoginUser(
          userRepository,
          credentialRepository,
          sessionRepository,
          domainEventRepository,
          passwordHasher,
          generateTokensService,
          userSessionManagerService,
          requestOriginApplicationService,
          clockService,
          unitOfWork,
          loggerService,
          idGeneratorService,
        ),
      inject: [
        USER_REPOSITORY,
        USER_CREDENTIAL_REPOSITORY,
        USER_SESSION_REPOSITORY,
        DOMAIN_EVENT_REPOSITORY,
        PASSWORD_HASHER,
        GENERATE_TOKENS_SERVICE,
        USER_SESSION_POLICY_MANAGER_SERVICE,
        REQUEST_ORIGIN_SERVICE,
        CLOCK_SERVICE,
        UNIT_OF_WORK,
        LOGGER_SERVICE,
        ID_GENERATOR,
      ],
    },
    {
      provide: REFRESH_SESSION,
      useFactory: (
        unitOfWork: UnitOfWork,
        userRepository: UserRepositoryInterface,
        sessionRepository: UserSessionRepositoryInterface,
        generateTokensService: GenerateTokensApplicationService,
        userSessionManagerService: UserSessionPolicyManagerApplicationService,
        requestOriginApplicationService: RequestOriginApplicationService,
        hasherService: HasherServiceInterface,
        clockService: NodeClockService,
      ) => {
        return new RefreshSession(
          unitOfWork,
          userRepository,
          sessionRepository,
          generateTokensService,
          userSessionManagerService,
          requestOriginApplicationService,
          hasherService,
          clockService,
        )
      },
      inject: [
        UNIT_OF_WORK,
        USER_REPOSITORY,
        USER_SESSION_REPOSITORY,
        GENERATE_TOKENS_SERVICE,
        USER_SESSION_POLICY_MANAGER_SERVICE,
        REQUEST_ORIGIN_SERVICE,
        HASHER_SERVICE,
        CLOCK_SERVICE,
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
        loggerService: LoggerServiceInterface,
        idGeneratorService: IdGeneratorServiceInterface,
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
          loggerService,
          idGeneratorService,
        )
      },
      inject: [
        VERIFICATION_TOKEN_REPOSITORY,
        USER_REPOSITORY,
        DOMAIN_EVENT_REPOSITORY,
        EMAIL_SENDER_SERVICE,
        UNIT_OF_WORK,
        HASHER_SERVICE,
        REQUEST_ORIGIN_SERVICE,
        CLOCK_SERVICE,
        RANDOM_SERVICE,
        ConfigService,
        LOGGER_SERVICE,
        ID_GENERATOR,
      ],
    },
  ],
  exports: [LOGIN_USER, REFRESH_SESSION, GENERATE_VERIFICATION_TOKEN, TypeOrmModule],
})
export class AuthModule {}
