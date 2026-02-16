import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator'
import { RetroStatus } from '@prisma/client'

export class CreateRetroDto {
  @IsString()
  @MaxLength(100)
  name!: string

  @IsDateString()
  date!: string

  @IsEnum(RetroStatus)
  @IsOptional()
  status?: RetroStatus
}
