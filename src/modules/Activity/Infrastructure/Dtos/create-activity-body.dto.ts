import {
  IsDate,
  IsDefined,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

class CreateActivityConfigDto {
  @IsDefined()
  @IsObject()
  capabilities: Record<string, unknown>

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  specs: Record<string, unknown>
}

export class CreateActivityBodyDto {
  @IsNotEmpty()
  @IsUUID()
  sportId: string

  @IsString()
  title: string

  @IsString()
  @IsOptional()
  description: string | null = null

  @IsDate()
  @Type(() => Date)
  scheduledDate: Date

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateActivityConfigDto)
  config: CreateActivityConfigDto
}
