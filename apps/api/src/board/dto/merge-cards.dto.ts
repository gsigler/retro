import { IsString, IsArray, ArrayMinSize } from 'class-validator'

export class MergeCardsDto {
  @IsString()
  parentCardId!: string

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  childCardIds!: string[]
}
