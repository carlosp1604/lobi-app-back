import { Module } from '@nestjs/common'
import { GetSports } from '~/src/modules/Activity/Application/GetSports/GetSports'
import { AuthModule } from '~/src/modules/Auth/Infrastructure/auth.module'
import { UserEntity } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { SportEntity } from '~/src/modules/Activity/Infrastructure/Entities/sport.entity'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ActivityEntity } from '~/src/modules/Activity/Infrastructure/Entities/activity.entity'
import { CreateActivity } from '~/src/modules/Activity/Application/CreateActivity/CreateActivity'
import { LOGGER_FACTORY } from '~/src/modules/Shared/Infrastructure/logger.module'
import { USER_REPOSITORY } from '~/src/modules/Auth/Infrastructure/auth.tokens'
import { DomainEventEntity } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'
import { ActivityController } from '~/src/modules/Activity/Infrastructure/activity.controller'
import { ParticipationEntity } from '~/src/modules/Activity/Infrastructure/Entities/participation.entity'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { LoggerFactoryInterface } from '~/src/modules/Shared/Domain/LoggerFactoryInterface'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { SportRepositoryInterface } from '~/src/modules/Activity/Domain/Sport/SportRepositoryInterface'
import { PostgreSqlSportRepository } from '~/src/modules/Activity/Infrastructure/PostgreSqlSportRepository'
import { ActivityRepositoryInterface } from '~/src/modules/Activity/Domain/ActivityRepositoryInterface'
import { CLOCK_SERVICE, ID_GENERATOR } from '~/src/modules/Shared/Infrastructure/shared.tokens'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { PostgreSqlActivityRepository } from '~/src/modules/Activity/Infrastructure/PostgreSqlActivityRepository'
import { ParticipationRepositoryInterface } from '~/src/modules/Activity/Domain/Participation/ParticipationRepositoryInterface'
import { PostgreSqlParticipationRepository } from '~/src/modules/Activity/Infrastructure/PostgreSqlParticipationRepository'
import { TYPEORM_MANAGER_RESOLVER, UNIT_OF_WORK } from '~/src/db/config/typeorm.tokens'
import {
  ACTIVITY_REPOSITORY,
  CREATE_ACTIVITY,
  GET_ACTIVITY,
  GET_SPORTS,
  PARTICIPATION_REPOSITORY,
  SPORT_REPOSITORY,
} from '~/src/modules/Activity/Infrastructure/activity.tokens'
import { GetActivity } from '~/src/modules/Activity/Application/GetActivity/GetActivity'

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([UserEntity, DomainEventEntity, ActivityEntity, ParticipationEntity, SportEntity]),
  ],
  controllers: [ActivityController],
  providers: [
    {
      provide: ACTIVITY_REPOSITORY,
      useFactory: (managerResolver: TypeOrmManagerResolver) => {
        return new PostgreSqlActivityRepository(managerResolver)
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
      provide: CREATE_ACTIVITY,
      useFactory: (
        userRepository: UserRepositoryInterface,
        sportRepository: SportRepositoryInterface,
        activityRepository: ActivityRepositoryInterface,
        participationRepository: ParticipationRepositoryInterface,
        clockService: ClockServiceInterface,
        unitOfWork: UnitOfWork,
        loggerFactory: LoggerFactoryInterface,
        idGenerator: IdGeneratorServiceInterface,
      ) => {
        return new CreateActivity(
          userRepository,
          sportRepository,
          activityRepository,
          participationRepository,
          clockService,
          unitOfWork,
          loggerFactory.createLogger(CreateActivity.name),
          idGenerator,
        )
      },
      inject: [
        USER_REPOSITORY,
        SPORT_REPOSITORY,
        ACTIVITY_REPOSITORY,
        PARTICIPATION_REPOSITORY,
        CLOCK_SERVICE,
        UNIT_OF_WORK,
        LOGGER_FACTORY,
        ID_GENERATOR,
      ],
    },
    {
      provide: GET_SPORTS,
      useFactory: (sportRepository: SportRepositoryInterface) => {
        return new GetSports(sportRepository)
      },
      inject: [SPORT_REPOSITORY],
    },
    {
      provide: GET_ACTIVITY,
      useFactory: (activityRepository: ActivityRepositoryInterface) => {
        return new GetActivity(activityRepository)
      },
      inject: [ACTIVITY_REPOSITORY],
    },
  ],
  exports: [CREATE_ACTIVITY, GET_SPORTS, GET_ACTIVITY],
})
export class ActivityModule {}
