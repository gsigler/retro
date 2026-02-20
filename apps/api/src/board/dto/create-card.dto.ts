import { IsString, MaxLength } from 'class-validator'

export class CreateCardDto {
  @IsString()
  columnId!: string

  @IsString()
  @MaxLength(2000)
  content!: string
}
