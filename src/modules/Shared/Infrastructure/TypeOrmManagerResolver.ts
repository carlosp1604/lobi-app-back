import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, EntityManager } from 'typeorm'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { TypeOrmTxContext } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'

@Injectable()
export class TypeOrmManagerResolver {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  resolve(context?: TxContext): EntityManager {
    return context instanceof TypeOrmTxContext ? context.manager : this.ds.manager
  }
}
