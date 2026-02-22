import { IsString, MinLength, MaxLength } from 'class-validator'

export class CreateCardDto {
  @IsString()
  columnId!: string

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string
}
