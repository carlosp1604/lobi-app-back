import { Module } from '@nestjs/common'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { SpecFactory } from '~/src/modules/Activity/Domain/Config/Spec/SpecFactory'
import { SportEntity } from '~/src/modules/Activity/Infrastructure/Entities/sport.entity'
import { ConfigModule } from '@nestjs/config'
import { EntityManager } from 'typeorm'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ActivityEntity } from '~/src/modules/Activity/Infrastructure/Entities/activity.entity'
import { CapabilityFactory } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityFactory'
import { DomainEventEntity } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'
import { ParticipantEntity } from '~/src/modules/Activity/Infrastructure/Entities/participant.entity'
import { ActivityController } from '~/src/modules/Activity/Infrastructure/activity.controller'
import { ParticipationEntity } from '~/src/modules/Activity/Infrastructure/Entities/participation.entity'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { GetSportsQueryHandler } from '~/src/modules/Activity/Application/GetSports/GetSportsQueryHandler'
import { SpecTranslatorFactory } from '~/src/modules/Activity/Application/Translator/Config/Spec/SpecTranslatorFactory'
import { SportsFinderInterface } from '~/src/modules/Activity/Application/GetSports/SportsFinderInterface'
import { LoggerFactoryInterface } from '~/src/modules/Shared/Domain/LoggerFactoryInterface'
import { PostgreSqlSportsFinder } from '~/src/modules/Activity/Infrastructure/Queries/PostgreSqlSportsFinder'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { ActivityFinderInterface } from '~/src/modules/Activity/Application/GetActivity/ActivityFinderInterface'
import { GetActivityQueryHandler } from '~/src/modules/Activity/Application/GetActivity/GetActivityQueryHandler'
import { PostgreSqlActivityFinder } from '~/src/modules/Activity/Infrastructure/Queries/PostgreSqlActivityFinder'
import { SportRepositoryInterface } from '~/src/modules/Activity/Domain/Sport/SportRepositoryInterface'
import { ActivitiesFinderInterface } from '~/src/modules/Activity/Application/Shared/ActivitiesFinderInterface'
import { GetActivitiesQueryHandler } from '~/src/modules/Activity/Application/GetActivities/GetActivitiesQueryHandler'
import { PostgreSqlSportRepository } from '~/src/modules/Activity/Infrastructure/PostgreSqlSportRepository'
import { JoinActivityCommandHandler } from '~/src/modules/Activity/Application/JoinActivity/JoinActivityCommandHandler'
import { PostgreSqlActivitiesFinder } from '~/src/modules/Activity/Infrastructure/Queries/PostgreSqlActivitiesFinder'
import { SpecPayloadContractFactory } from '~/src/modules/Activity/Application/Config/Spec/SpecPayloadContractFactory'
import { ActivityRepositoryInterface } from '~/src/modules/Activity/Domain/ActivityRepositoryInterface'
import { CapabilityTranslatorFactory } from '~/src/modules/Activity/Application/Translator/Config/Capability/CapabilityTranslatorFactory'
import { CLOCK_SERVICE, ID_GENERATOR } from '~/src/modules/Shared/Infrastructure/shared.tokens'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { LeaveActivityCommandHandler } from '~/src/modules/Activity/Application/LeaveActivity/LeaveActivityCommandHandler'
import { CancelActivityCommandHandler } from '~/src/modules/Activity/Application/CancelActivity/CancelActivityCommandHandler'
import { CreateActivityCommandHandler } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityCommandHandler'
import { PostgreSqlActivityRepository } from '~/src/modules/Activity/Infrastructure/PostgreSqlActivityRepository'
import { LOGGER_FACTORY, LoggerModule } from '~/src/modules/Shared/Infrastructure/logger.module'
import { GetUserActivitiesQueryHandler } from '~/src/modules/Activity/Application/GetUserActivities/GetUserActivitiesQueryHandler'
import { ParticipantRepositoryInterface } from '~/src/modules/Activity/Domain/Participant/ParticipantRepositoryInterface'
import { PostgreSqlParticipantRepository } from '~/src/modules/Activity/Infrastructure/PostgreSqlParticipantRepository'
import { CapabilityPayloadContractFactory } from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractFactory'
import { ParticipationRepositoryInterface } from '~/src/modules/Activity/Domain/Participation/ParticipationRepositoryInterface'
import { PostgreSqlParticipationRepository } from '~/src/modules/Activity/Infrastructure/PostgreSqlParticipationRepository'
import { TYPEORM_MANAGER_RESOLVER, UNIT_OF_WORK } from '~/src/db/config/typeorm.tokens'
import {
  ACTIVITIES_FINDER,
  ACTIVITY_FINDER,
  ACTIVITY_REPOSITORY,
  CANCEL_ACTIVITY_COMMAND_HANDLER,
  CAPABILITY_FACTORY,
  CAPABILITY_PAYLOAD_CONTRACT_FACTORY,
  CAPABILITY_TRANSLATOR_FACTORY,
  CREATE_ACTIVITY_COMMAND_HANDLER,
  GET_ACTIVITIES_QUERY_HANDLER,
  GET_ACTIVITY_QUERY_HANDLER,
  GET_SPORTS_QUERY_HANDLER,
  GET_USER_ACTIVITIES_QUERY_HANDLER,
  JOIN_ACTIVITY_COMMAND_HANDLER,
  LEAVE_ACTIVITY_COMMAND_HANDLER,
  PARTICIPANT_REPOSITORY,
  PARTICIPATION_REPOSITORY,
  SPEC_FACTORY,
  SPEC_PAYLOAD_CONTRACT_FACTORY,
  SPEC_TRANSLATOR_FACTORY,
  SPORT_REPOSITORY,
  SPORTS_FINDER,
} from '~/src/modules/Activity/Infrastructure/activity.tokens'

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    TypeOrmModule.forFeature([DomainEventEntity, ActivityEntity, ParticipationEntity, SportEntity, ParticipantEntity]),
  ],
  controllers: [ActivityController],
  providers: [
    {
      provide: ACTIVITY_REPOSITORY,
      useFactory: (managerResolver: TypeOrmManagerResolver, capabilityFactory: CapabilityFactory, specFactory: SpecFactory) => {
        return new PostgreSqlActivityRepository(managerResolver, capabilityFactory, specFactory)
      },
      inject: [TYPEORM_MANAGER_RESOLVER, CAPABILITY_FACTORY, SPEC_FACTORY],
    },
    {
      provide: PARTICIPANT_REPOSITORY,
      useFactory: (managerResolver: TypeOrmManagerResolver) => {
        return new PostgreSqlParticipantRepository(managerResolver)
      },
      inject: [TYPEORM_MANAGER_RESOLVER],
    },
    {
      provide: PARTICIPATION_REPOSITORY,
      useFactory: (managerResolver: TypeOrmManagerResolver) => {
        return new PostgreSqlParticipationRepository(managerResolver)
      },
      inject: [TYPEORM_MANAGER_RESOLVER],
    },
    {
      provide: SPORT_REPOSITORY,
      useFactory: (managerResolver: TypeOrmManagerResolver) => {
        return new PostgreSqlSportRepository(managerResolver)
      },
      inject: [TYPEORM_MANAGER_RESOLVER],
    },
    {
      provide: ACTIVITIES_FINDER,
      useFactory: (entityManager: EntityManager) => {
        return new PostgreSqlActivitiesFinder(entityManager)
      },
      inject: [EntityManager],
    },
    {
      provide: ACTIVITY_FINDER,
      useFactory: (entityManager: EntityManager) => {
        return new PostgreSqlActivityFinder(entityManager)
      },
      inject: [EntityManager],
    },
    {
      provide: SPORTS_FINDER,
      useFactory: (entityManager: EntityManager) => {
        return new PostgreSqlSportsFinder(entityManager)
      },
      inject: [EntityManager],
    },
    {
      provide: CAPABILITY_FACTORY,
      useClass: CapabilityFactory,
    },
    {
      provide: CAPABILITY_PAYLOAD_CONTRACT_FACTORY,
      useClass: CapabilityPayloadContractFactory,
    },
    {
      provide: CAPABILITY_TRANSLATOR_FACTORY,
      useClass: CapabilityTranslatorFactory,
    },
    {
      provide: SPEC_FACTORY,
      useClass: SpecFactory,
    },
    {
      provide: SPEC_PAYLOAD_CONTRACT_FACTORY,
      useClass: SpecPayloadContractFactory,
    },
    {
      provide: SPEC_TRANSLATOR_FACTORY,
      useClass: SpecTranslatorFactory,
    },
    {
      provide: CREATE_ACTIVITY_COMMAND_HANDLER,
      useFactory: (
        participantRepository: ParticipantRepositoryInterface,
        sportRepository: SportRepositoryInterface,
        activityRepository: ActivityRepositoryInterface,
        participationRepository: ParticipationRepositoryInterface,
        clockService: ClockServiceInterface,
        unitOfWork: UnitOfWork,
        loggerFactory: LoggerFactoryInterface,
        idGenerator: IdGeneratorServiceInterface,
        capabilityPayloadContractFactory: CapabilityPayloadContractFactory,
        specPayloadContractFactory: SpecPayloadContractFactory,
        capabilityFactory: CapabilityFactory,
        specFactory: SpecFactory,
      ) => {
        return new CreateActivityCommandHandler(
          participantRepository,
          sportRepository,
          activityRepository,
          participationRepository,
          clockService,
          unitOfWork,
          loggerFactory.createLogger(CreateActivityCommandHandler.name),
          idGenerator,
          capabilityPayloadContractFactory,
          specPayloadContractFactory,
          capabilityFactory,
          specFactory,
        )
      },
      inject: [
        PARTICIPANT_REPOSITORY,
        SPORT_REPOSITORY,
        ACTIVITY_REPOSITORY,
        PARTICIPATION_REPOSITORY,
        CLOCK_SERVICE,
        UNIT_OF_WORK,
        LOGGER_FACTORY,
        ID_GENERATOR,
        CAPABILITY_PAYLOAD_CONTRACT_FACTORY,
        SPEC_PAYLOAD_CONTRACT_FACTORY,
        CAPABILITY_FACTORY,
        SPEC_FACTORY,
      ],
    },
    {
      provide: GET_SPORTS_QUERY_HANDLER,
      useFactory: (
        sportsFinder: SportsFinderInterface,
        capabilityPayloadContractFactory: CapabilityPayloadContractFactory,
        specPayloadContractFactory: SpecPayloadContractFactory,
      ) => {
        return new GetSportsQueryHandler(sportsFinder, capabilityPayloadContractFactory, specPayloadContractFactory)
      },
      inject: [SPORTS_FINDER, CAPABILITY_PAYLOAD_CONTRACT_FACTORY, SPEC_PAYLOAD_CONTRACT_FACTORY],
    },
    {
      provide: GET_ACTIVITIES_QUERY_HANDLER,
      useFactory: (activitiesFinder: ActivitiesFinderInterface, clockService: ClockServiceInterface) => {
        return new GetActivitiesQueryHandler(activitiesFinder, clockService)
      },
      inject: [ACTIVITIES_FINDER, CLOCK_SERVICE],
    },
    {
      provide: GET_USER_ACTIVITIES_QUERY_HANDLER,
      useFactory: (activitiesFinder: ActivitiesFinderInterface, clockService: ClockServiceInterface) => {
        return new GetUserActivitiesQueryHandler(activitiesFinder, clockService)
      },
      inject: [ACTIVITIES_FINDER, CLOCK_SERVICE],
    },
    {
      provide: GET_ACTIVITY_QUERY_HANDLER,
      useFactory: (
        activityFinder: ActivityFinderInterface,
        capabilityTranslatorFactory: CapabilityTranslatorFactory,
        specTranslatorFactory: SpecTranslatorFactory,
      ) => {
        return new GetActivityQueryHandler(activityFinder, capabilityTranslatorFactory, specTranslatorFactory)
      },
      inject: [ACTIVITY_FINDER, CAPABILITY_TRANSLATOR_FACTORY, SPEC_TRANSLATOR_FACTORY],
    },
    {
      provide: JOIN_ACTIVITY_COMMAND_HANDLER,
      useFactory: (
        participantRepository: ParticipantRepositoryInterface,
        activityRepository: ActivityRepositoryInterface,
        participationRepository: ParticipationRepositoryInterface,
        clockService: ClockServiceInterface,
        unitOfWork: UnitOfWork,
        loggerFactory: LoggerFactoryInterface,
        idGenerator: IdGeneratorServiceInterface,
      ) => {
        return new JoinActivityCommandHandler(
          participantRepository,
          activityRepository,
          participationRepository,
          clockService,
          unitOfWork,
          loggerFactory.createLogger(JoinActivityCommandHandler.name),
          idGenerator,
        )
      },
      inject: [
        PARTICIPANT_REPOSITORY,
        ACTIVITY_REPOSITORY,
        PARTICIPATION_REPOSITORY,
        CLOCK_SERVICE,
        UNIT_OF_WORK,
        LOGGER_FACTORY,
        ID_GENERATOR,
      ],
    },
    {
      provide: LEAVE_ACTIVITY_COMMAND_HANDLER,
      useFactory: (
        participantRepository: ParticipantRepositoryInterface,
        activityRepository: ActivityRepositoryInterface,
        participationRepository: ParticipationRepositoryInterface,
        clockService: ClockServiceInterface,
        unitOfWork: UnitOfWork,
        loggerFactory: LoggerFactoryInterface,
        idGenerator: IdGeneratorServiceInterface,
      ) => {
        return new LeaveActivityCommandHandler(
          participantRepository,
          activityRepository,
          participationRepository,
          clockService,
          unitOfWork,
          loggerFactory.createLogger(LeaveActivityCommandHandler.name),
          idGenerator,
        )
      },
      inject: [
        PARTICIPANT_REPOSITORY,
        ACTIVITY_REPOSITORY,
        PARTICIPATION_REPOSITORY,
        CLOCK_SERVICE,
        UNIT_OF_WORK,
        LOGGER_FACTORY,
        ID_GENERATOR,
      ],
    },
    {
      provide: CANCEL_ACTIVITY_COMMAND_HANDLER,
      useFactory: (
        participantRepository: ParticipantRepositoryInterface,
        activityRepository: ActivityRepositoryInterface,
        clockService: ClockServiceInterface,
        unitOfWork: UnitOfWork,
        loggerFactory: LoggerFactoryInterface,
        idGenerator: IdGeneratorServiceInterface,
      ) => {
        return new CancelActivityCommandHandler(
          participantRepository,
          activityRepository,
          clockService,
          unitOfWork,
          loggerFactory.createLogger(CancelActivityCommandHandler.name),
          idGenerator,
        )
      },
      inject: [PARTICIPANT_REPOSITORY, ACTIVITY_REPOSITORY, CLOCK_SERVICE, UNIT_OF_WORK, LOGGER_FACTORY, ID_GENERATOR],
    },
  ],
  exports: [
    CREATE_ACTIVITY_COMMAND_HANDLER,
    GET_SPORTS_QUERY_HANDLER,
    GET_ACTIVITY_QUERY_HANDLER,
    GET_ACTIVITIES_QUERY_HANDLER,
    GET_USER_ACTIVITIES_QUERY_HANDLER,
    JOIN_ACTIVITY_COMMAND_HANDLER,
    LEAVE_ACTIVITY_COMMAND_HANDLER,
    CANCEL_ACTIVITY_COMMAND_HANDLER,
  ],
})
export class ActivityModule {}
