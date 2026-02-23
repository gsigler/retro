import { IsString, IsInt, Min } from 'class-validator'

export class BoardJoinDto {
  @IsString()
  retroId!: string
}

export class BoardLeaveDto {
  @IsString()
  retroId!: string
}

export class IcebreakerShuffleDto {
  @IsString()
  retroId!: string

  @IsInt()
  @Min(0)
  shuffleCount!: number
}
