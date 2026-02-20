import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator'
import { ActionItemStatus } from '../action-items.service.js'

export class UpdateActionItemDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(ActionItemStatus)
  @IsOptional()
  status?: ActionItemStatus

  @IsString()
  @IsOptional()
  assigneeId?: string | null

  @IsDateString()
  @IsOptional()
  dueDate?: string | null
}
