import { AccessToken } from '~/src/modules/Auth/Infrastructure/Decorators/access-token.decorator'
import { LOGGER_FACTORY } from '~/src/modules/Shared/Infrastructure/logger.module'
import type { JwtPayload } from '~/src/modules/Auth/Infrastructure/jwt-payload.schema'
import { AccessTokenGuard } from '~/src/modules/Auth/Infrastructure/Guards/access-token.guard'
import { UNAUTHORIZED_ACCESS } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { CreateActivityBodyDto } from '~/src/modules/Activity/Infrastructure/Dtos/create-activity-body.dto'
import { GetSportsQueryHandler } from '~/src/modules/Activity/Application/GetSports/GetSportsQueryHandler'
import { CreateActivityCommandError } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityCommandError'
import {
  CREATE_ACTIVITY_COMMAND_HANDLER,
  GET_ACTIVITY_QUERY_HANDLER,
  GET_SPORTS_QUERY_HANDLER,
  JOIN_ACTIVITY_COMMAND_HANDLER,
  LEAVE_ACTIVITY_COMMAND_HANDLER,
} from '~/src/modules/Activity/Infrastructure/activity.tokens'
import {
  CREATE_ACTIVITY_INVALID_INPUT,
  CREATE_ACTIVITY_INVALID_SPORT_ID,
  CREATE_ACTIVITY_SPORT_NOT_FOUND,
  GET_ACTIVITY_ACTIVITY_NOT_FOUND,
  JOIN_ACTIVITY_ACTIVITY_ALREADY_FULL,
  JOIN_ACTIVITY_ACTIVITY_ALREADY_STARTED,
  JOIN_ACTIVITY_ACTIVITY_NOT_AVAILABLE_TO_JOIN,
  JOIN_ACTIVITY_ACTIVITY_NOT_FOUND,
  JOIN_ACTIVITY_ACTIVITY_STATUS_DOES_NOT_ALLOW_JOIN,
  JOIN_ACTIVITY_USER_ALREADY_JOINED,
  LEAVE_ACTIVITY_ACTIVITY_ALREADY_CONFIRMED_TO_TAKE_PLACE,
  LEAVE_ACTIVITY_ACTIVITY_LEAVE_DEADLINE_ALREADY_PASSED,
  LEAVE_ACTIVITY_ACTIVITY_NOT_FOUND,
  LEAVE_ACTIVITY_ACTIVITY_STATUS_DOES_NOT_ALLOW_LEAVE,
  LEAVE_ACTIVITY_USER_IS_NOT_A_PARTICIPANT,
} from '~/src/modules/Activity/Infrastructure/ApiCodes'
import {
  Body,
  Controller,
  Post,
  Inject,
  UseGuards,
  UnauthorizedException,
  UnprocessableEntityException,
  InternalServerErrorException,
  Get,
  Header,
  Param,
  NotFoundException,
  ConflictException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { GetActivityQueryHandler } from '~/src/modules/Activity/Application/GetActivity/GetActivityQueryHandler'
import { OptionalAuth } from '~/src/modules/Auth/Infrastructure/Decorators/optional-auth.decorator'
import { GetActivityQuery } from '~/src/modules/Activity/Application/GetActivity/GetActivityQuery'
import { GetActivityQueryError } from '~/src/modules/Activity/Application/GetActivity/GetActivityQueryError'
import { ConfigService } from '@nestjs/config'
import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'
import type { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import type { LoggerFactoryInterface } from '~/src/modules/Shared/Domain/LoggerFactoryInterface'
import { CreateActivityCommandHandler } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityCommandHandler'
import { CreateActivityCommand } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityCommand'
import { JoinActivityCommandHandler } from '~/src/modules/Activity/Application/JoinActivity/JoinActivityCommandHandler'
import { JoinActivityCommand } from '~/src/modules/Activity/Application/JoinActivity/JoinActivityCommand'
import { JoinActivityCommandError } from '~/src/modules/Activity/Application/JoinActivity/JoinActivityCommandError'
import { LeaveActivityCommandHandler } from '~/src/modules/Activity/Application/LeaveActivity/LeaveActivityCommandHandler'
import { LeaveActivityCommand } from '~/src/modules/Activity/Application/LeaveActivity/LeaveActivityCommand'
import { LeaveActivityCommandError } from '~/src/modules/Activity/Application/LeaveActivity/LeaveActivityCommandError'

@Controller('activity')
export class ActivityController {
  private readonly loggerService: LoggerServiceInterface

  constructor(
    @Inject(CREATE_ACTIVITY_COMMAND_HANDLER) private readonly createActivityCommandHandler: CreateActivityCommandHandler,
    @Inject(GET_SPORTS_QUERY_HANDLER) private readonly getSportsQueryHandler: GetSportsQueryHandler,
    @Inject(GET_ACTIVITY_QUERY_HANDLER) private readonly getActivityQueryHandler: GetActivityQueryHandler,
    @Inject(JOIN_ACTIVITY_COMMAND_HANDLER) private readonly joinActivityCommandHandler: JoinActivityCommandHandler,
    @Inject(LEAVE_ACTIVITY_COMMAND_HANDLER) private readonly leaveActivityCommandHandler: LeaveActivityCommandHandler,
    @Inject(LOGGER_FACTORY) private readonly loggerFactory: LoggerFactoryInterface,
    private readonly configService: ConfigService<Env, true>,
  ) {
    this.loggerService = loggerFactory.createLogger(ActivityController.name)
  }

  @Post()
  @UseGuards(AccessTokenGuard)
  async create(@AccessToken() accessToken: JwtPayload, @Body() body: CreateActivityBodyDto) {
    const requestDto: CreateActivityCommand = {
      ...body,
      userId: accessToken.sub,
    }

    const result = await this.createActivityCommandHandler.execute(requestDto)

    if (result.success) {
      return result.value
    }

    const error = result.error

    switch (error.id) {
      case CreateActivityCommandError.invalidUserIdId: {
        this.logInvalidUserId(accessToken, error)

        throw new InternalServerErrorException(error)
      }

      case CreateActivityCommandError.userDisabledId:
      case CreateActivityCommandError.userNotFoundId:
        throw new UnauthorizedException({
          code: UNAUTHORIZED_ACCESS,
          message: 'Unauthorized access',
        })

      case CreateActivityCommandError.invalidSportIdId:
        throw new UnprocessableEntityException({
          code: CREATE_ACTIVITY_INVALID_SPORT_ID,
          message: error.message,
        })

      case CreateActivityCommandError.sportNotFoundId:
        throw new UnprocessableEntityException({
          code: CREATE_ACTIVITY_SPORT_NOT_FOUND,
          message: error.message,
        })

      case CreateActivityCommandError.invalidInputId:
        throw new UnprocessableEntityException({
          code: CREATE_ACTIVITY_INVALID_INPUT,
          message: error.message,
          errors: error.errors,
        })

      default:
        throw new InternalServerErrorException(error)
    }
  }

  @Post(':id/join')
  @UseGuards(AccessTokenGuard)
  async joinActivity(@AccessToken() accessToken: JwtPayload, @Param('id') id: string) {
    const command = new JoinActivityCommand(accessToken.sub, id)

    const result = await this.joinActivityCommandHandler.execute(command)

    if (result.success) {
      return result.value
    }

    const error = result.error

    switch (error.id) {
      case JoinActivityCommandError.invalidUserIdId: {
        this.logInvalidUserId(accessToken, error)

        throw new InternalServerErrorException(error)
      }

      case JoinActivityCommandError.userDisabledId:
      case JoinActivityCommandError.userNotFoundId:
        throw new UnauthorizedException({
          code: UNAUTHORIZED_ACCESS,
          message: 'Unauthorized access',
        })

      case JoinActivityCommandError.invalidActivityIdId:
      case JoinActivityCommandError.activityNotFoundId:
        throw new UnprocessableEntityException({
          code: JOIN_ACTIVITY_ACTIVITY_NOT_FOUND,
          message: error.message,
        })

      case JoinActivityCommandError.participantAlreadyJoinedId:
        throw new ConflictException({
          code: JOIN_ACTIVITY_USER_ALREADY_JOINED,
          message: error.message,
        })

      case JoinActivityCommandError.activityStatusDoesNotAllowJoinId:
        throw new ConflictException({
          code: JOIN_ACTIVITY_ACTIVITY_STATUS_DOES_NOT_ALLOW_JOIN,
          message: error.message,
        })

      case JoinActivityCommandError.activityAlreadyFullId:
        throw new ConflictException({
          code: JOIN_ACTIVITY_ACTIVITY_ALREADY_FULL,
          message: error.message,
        })

      case JoinActivityCommandError.activityAlreadyStartedId:
        throw new ConflictException({
          code: JOIN_ACTIVITY_ACTIVITY_ALREADY_STARTED,
          message: error.message,
        })

      case JoinActivityCommandError.activityNotAvailableToJoinId:
        throw new ConflictException({
          code: JOIN_ACTIVITY_ACTIVITY_NOT_AVAILABLE_TO_JOIN,
          message: error.message,
        })

      default:
        throw new InternalServerErrorException(error)
    }
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenGuard)
  async leaveActivity(@AccessToken() accessToken: JwtPayload, @Param('id') id: string) {
    const command = new LeaveActivityCommand(accessToken.sub, id)

    const result = await this.leaveActivityCommandHandler.execute(command)

    if (result.success) {
      return result.value
    }

    const error = result.error

    switch (error.id) {
      case LeaveActivityCommandError.invalidUserIdId: {
        this.logInvalidUserId(accessToken, error)

        throw new InternalServerErrorException(error)
      }

      case LeaveActivityCommandError.userDisabledId:
      case LeaveActivityCommandError.userNotFoundId:
        throw new UnauthorizedException({
          code: UNAUTHORIZED_ACCESS,
          message: 'Unauthorized access',
        })

      case LeaveActivityCommandError.invalidActivityIdId:
      case LeaveActivityCommandError.activityNotFoundId:
        throw new UnprocessableEntityException({
          code: LEAVE_ACTIVITY_ACTIVITY_NOT_FOUND,
          message: error.message,
        })

      case LeaveActivityCommandError.userIsNotAParticipantId:
        throw new ConflictException({
          code: LEAVE_ACTIVITY_USER_IS_NOT_A_PARTICIPANT,
          message: error.message,
        })

      case LeaveActivityCommandError.activityStatusDoesNotAllowLeaveId:
        throw new ConflictException({
          code: LEAVE_ACTIVITY_ACTIVITY_STATUS_DOES_NOT_ALLOW_LEAVE,
          message: error.message,
        })

      case LeaveActivityCommandError.activityLeaveDeadlineAlreadyPassedId:
        throw new ConflictException({
          code: LEAVE_ACTIVITY_ACTIVITY_LEAVE_DEADLINE_ALREADY_PASSED,
          message: error.message,
        })

      case LeaveActivityCommandError.activityAlreadyConfirmedToTakePlaceId:
        throw new ConflictException({
          code: LEAVE_ACTIVITY_ACTIVITY_ALREADY_CONFIRMED_TO_TAKE_PLACE,
          message: error.message,
        })

      default:
        throw new InternalServerErrorException(error)
    }
  }

  @Get('/sports')
  @Header('Cache-Control', 'public, max-age=86400')
  async getSports() {
    return this.getSportsQueryHandler.execute()
  }

  @Get(':id')
  @OptionalAuth()
  @UseGuards(AccessTokenGuard)
  async getActivity(@AccessToken() accessToken: JwtPayload | undefined, @Param('id') id: string) {
    const userId = accessToken ? accessToken.sub : null

    const requestDto = new GetActivityQuery(id, userId)

    const result = await this.getActivityQueryHandler.execute(requestDto)

    if (result.success) {
      return result.value
    }

    const error = result.error

    switch (error.id) {
      case GetActivityQueryError.invalidUserIdId: {
        this.logInvalidUserId(accessToken!, error)

        throw new InternalServerErrorException(error)
      }

      case GetActivityQueryError.invalidActivityIdId:
      case GetActivityQueryError.activityNotFoundId:
        throw new NotFoundException({
          code: GET_ACTIVITY_ACTIVITY_NOT_FOUND,
          message: error.message,
        })

      default:
        throw new InternalServerErrorException(error)
    }
  }

  private logInvalidUserId(accessToken: JwtPayload, error: Error) {
    this.loggerService.error('Critical error', error.stack, {
      reason: 'User ID was validated by AccessToken Guard but rejected by domain',
      userId: StringFormatter.formatSafe(accessToken.sub, 36),
      sessionId: StringFormatter.formatSafe(accessToken.sid, 36),
      expiresAt: StringFormatter.formatSafe(String(accessToken.exp), 36),
      error: error.message,
    })
  }
}
