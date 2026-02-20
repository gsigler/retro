import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator'
import { RetroStatus } from '../retros.service.js'

export class UpdateRetroDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string

  @IsDateString()
  @IsOptional()
  date?: string

  @IsEnum(RetroStatus)
  @IsOptional()
  status?: RetroStatus
}
