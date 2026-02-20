import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator'
import { RetroStatus } from '../retros.service.js'

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
