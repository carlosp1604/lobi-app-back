import { Module } from '@nestjs/common'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { LOGGER_SERVICE } from '~/src/modules/Shared/Infrastructure/logger.module'
import { AuthController } from '~/src/modules/Auth/Infrastructure/auth.controller'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import {
  DEVICE_LOCATION_RESOLVER,
  DOMAIN_EVENT_REPOSITORY,
  HASHER_SERVICE,
  IP_VALIDATOR,
  LOGIN_USER,
  MAX_SESSIONS_POLICY,
  PASSWORD_HASHER,
  TOKEN_GENERATOR,
  USER_CREDENTIAL_REPOSITORY,
  USER_REPOSITORY,
  USER_SESSION_REPOSITORY,
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

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([UserEntity, UserSessionEntity, UserCredentialEntity, DomainEventEntity])],
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
        return new NodeHasherService(configService.get<string>('HASH_SECRET', { infer: true }))
      },
      inject: [ConfigService],
    },
    { provide: DEVICE_LOCATION_RESOLVER, useClass: NoopDeviceLocationResolverService },
    { provide: IP_VALIDATOR, useClass: IpAddressIpValidatorService },
    {
      provide: MAX_SESSIONS_POLICY,
      useFactory: (configService: ConfigService<Env, true>) => {
        return new MaxSessionsPolicy({ maxActive: configService.get('USER_MAX_SESSIONS', { infer: true }) })
      },
      inject: [ConfigService],
    },
    {
      provide: LOGIN_USER,
      useFactory: (
        usersRepository: UserRepositoryInterface,
        credentialsRepository: UserCredentialRepositoryInterface,
        sessionsRepository: UserSessionRepositoryInterface,
        domainEventRepository: DomainEventRepositoryInterface,
        passwordHasher: PasswordHasherServiceInterface,
        tokenGenerator: TokenGeneratorApplicationServiceInterface,
        hasherService: HasherServiceInterface,
        deviceLocationResolver: DeviceLocationResolverServiceInterface,
        maxSessionsPolicy: MaxSessionsPolicy,
        clockService: NodeClockService,
        unitOfWork: UnitOfWork,
        loggerService: LoggerServiceInterface,
        idGeneratorService: IdGeneratorServiceInterface,
        ipValidator: IpValidatorServiceInterface,
        configService: ConfigService<Env, true>,
      ) =>
        new LoginUser(
          usersRepository,
          credentialsRepository,
          sessionsRepository,
          domainEventRepository,
          passwordHasher,
          tokenGenerator,
          hasherService,
          deviceLocationResolver,
          maxSessionsPolicy,
          clockService,
          unitOfWork,
          loggerService,
          idGeneratorService,
          ipValidator,
          configService.get('ACCESS_TTL_MS', { infer: true }),
          configService.get('REFRESH_TTL_MS', { infer: true }),
        ),
      inject: [
        USER_REPOSITORY,
        USER_CREDENTIAL_REPOSITORY,
        USER_SESSION_REPOSITORY,
        DOMAIN_EVENT_REPOSITORY,
        PASSWORD_HASHER,
        TOKEN_GENERATOR,
        HASHER_SERVICE,
        DEVICE_LOCATION_RESOLVER,
        MAX_SESSIONS_POLICY,
        CLOCK_SERVICE,
        UNIT_OF_WORK,
        LOGGER_SERVICE,
        ID_GENERATOR,
        IP_VALIDATOR,
        ConfigService,
      ],
    },
  ],
  exports: [LOGIN_USER, TypeOrmModule],
})
export class AuthModule {}
