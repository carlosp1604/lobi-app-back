import { Module } from '@nestjs/common'
import { UserEntity } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { ConfigModule } from '@nestjs/config'
import { EntityManager } from 'typeorm'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserController } from '~/src/modules/User/Infrastructure/user.controller'
import { UserFinderInterface } from '~/src/modules/User/Application/GetUserProfile/UserFinderInterface'
import { PostgreSqlUserFinder } from '~/src/modules/User/Infrastructure/Queries/PostgreSqlUserFinder'
import { SportsmanProfileEntity } from '~/src/modules/User/Infrastructure/Entities/Profiles/sportsman-profile.entity'
import { GetUserProfileByUsernameQueryHandler } from '~/src/modules/User/Application/GetUserProfile/GetUserProfileByUsernameQueryHandler'
import { GET_USER_PROFILE_BY_USERNAME_QUERY_HANDLER, USER_FINDER } from '~/src/modules/User/Infrastructure/user.tokens'

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([UserEntity, SportsmanProfileEntity])],
  controllers: [UserController],
  providers: [
    {
      provide: USER_FINDER,
      useFactory: (entityManager: EntityManager) => {
        return new PostgreSqlUserFinder(entityManager)
      },
      inject: [EntityManager],
    },
    {
      provide: GET_USER_PROFILE_BY_USERNAME_QUERY_HANDLER,
      useFactory: (userFinder: UserFinderInterface) => {
        return new GetUserProfileByUsernameQueryHandler(userFinder)
      },
      inject: [USER_FINDER],
    },
  ],
  exports: [GET_USER_PROFILE_BY_USERNAME_QUERY_HANDLER],
})
export class UserModule {}
