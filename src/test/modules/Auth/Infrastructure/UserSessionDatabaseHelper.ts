import { EntityManager, IsNull, MoreThan } from 'typeorm'
import { UserSessionEntity, UserSessionRawWithRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'

export class UserSessionDatabaseHelper {
  constructor(private readonly entityManager: EntityManager) {}

  public async findActiveSessions(userId: string, now: Date) {
    const userSessionRepository = this.entityManager.getRepository(UserSessionEntity)

    return userSessionRepository.findBy({
      user_id: userId,
      revoked_at: IsNull(),
      expires_at: MoreThan(now),
    })
  }

  public async findAll() {
    const userSessionRepository = this.entityManager.getRepository(UserSessionEntity)

    return userSessionRepository.find()
  }

  public async findById(sessionId: string) {
    const userSessionRepository = this.entityManager.getRepository(UserSessionEntity)

    return userSessionRepository.findOneBy({
      id: sessionId,
    })
  }

  public async save(sessions: UserSessionRawWithRelationships | Array<UserSessionRawWithRelationships>) {
    const userSessionRepository = this.entityManager.getRepository(UserSessionEntity)

    if (Array.isArray(sessions)) {
      await userSessionRepository.save(sessions)
    } else {
      await userSessionRepository.save(sessions)
    }
  }

  public async update(id: string, dataToUpdate: Partial<UserSessionRawWithRelationships>) {
    const userSessionRepository = this.entityManager.getRepository(UserSessionEntity)

    await userSessionRepository.update({ id }, dataToUpdate)
  }

  public async count(): Promise<number> {
    const userSessionRepository = this.entityManager.getRepository(UserSessionEntity)

    return userSessionRepository.count()
  }

  public async remove(session: UserSessionRawWithRelationships): Promise<void> {
    const userSessionRepository = this.entityManager.getRepository(UserSessionEntity)

    await userSessionRepository.remove(session)
  }

  public static findSessionByIdInArray(sessions: Array<UserSessionRawWithRelationships>, sessionId: string) {
    return sessions.find((session) => session.id === sessionId)
  }
}
