import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator'

export class RetroIdDto {
  @IsString()
  retroId!: string
}

export class TimerStartDto extends RetroIdDto {
  @IsInt()
  @IsOptional()
  @Min(10)
  @Max(3600)
  duration?: number
}
