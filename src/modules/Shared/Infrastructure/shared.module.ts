import { Global, Module } from '@nestjs/common'
import { NodeClockService } from '~/src/modules/Shared/Infrastructure/Services/NodeClockService'
import { NodeIdGeneratorService } from '~/src/modules/Shared/Infrastructure/Services/NodeIdGeneratorService'
import { CLOCK_SERVICE, ID_GENERATOR } from '~/src/modules/Shared/Infrastructure/shared.tokens'

@Global()
@Module({
  providers: [
    { provide: CLOCK_SERVICE, useClass: NodeClockService },
    { provide: ID_GENERATOR, useClass: NodeIdGeneratorService },
  ],
  exports: [CLOCK_SERVICE, ID_GENERATOR],
})
export class SharedModule {}
