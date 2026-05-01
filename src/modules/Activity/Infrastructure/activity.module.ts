import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { DomainEventEntity } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'
import { ConfigModule } from '@nestjs/config'
import { ActivityEntity } from '~/src/modules/Activity/Infrastructure/Entities/activity.entity'
import { ParticipationEntity } from '~/src/modules/Activity/Infrastructure/Entities/participation.entity'
import { SportEntity } from '~/src/modules/Activity/Infrastructure/Entities/sport.entity'
import { AuthModule } from '~/src/modules/Auth/Infrastructure/auth.module'
import {
  ACTIVITY_REPOSITORY,
  CREATE_ACTIVITY,
  PARTICIPATION_REPOSITORY,
  SPORT_REPOSITORY,
} from '~/src/modules/Activity/Infrastructure/activity.tokens'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { PostgreSqlActivityRepository } from '~/src/modules/Activity/Infrastructure/PostgreSqlActivityRepository'
import { TYPEORM_MANAGER_RESOLVER, UNIT_OF_WORK } from '~/src/db/config/typeorm.tokens'
import { PostgreSqlParticipationRepository } from '~/src/modules/Activity/Infrastructure/PostgreSqlParticipationRepository'
import { PostgreSqlSportRepository } from '~/src/modules/Activity/Infrastructure/PostgreSqlSportRepository'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { SportRepositoryInterface } from '~/src/modules/Activity/Domain/Sport/SportRepositoryInterface'
import { ActivityRepositoryInterface } from '~/src/modules/Activity/Domain/ActivityRepositoryInterface'
import { ParticipationRepositoryInterface } from '~/src/modules/Activity/Domain/ParticipationRepositoryInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { LoggerFactoryInterface } from '~/src/modules/Shared/Domain/LoggerFactoryInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { CreateActivity } from '~/src/modules/Activity/Application/CreateActivity/CreateActivity'
import { USER_REPOSITORY } from '~/src/modules/Auth/Infrastructure/auth.tokens'
import { CLOCK_SERVICE, ID_GENERATOR } from '~/src/modules/Shared/Infrastructure/shared.tokens'
import { LOGGER_FACTORY } from '~/src/modules/Shared/Infrastructure/logger.module'
import { ActivityController } from '~/src/modules/Activity/Infrastructure/activity.controller'

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
  ],
  exports: [CREATE_ACTIVITY],
})
export class ActivityModule {}
