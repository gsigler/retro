import { IsArray, IsString } from 'class-validator'

export class ReorderActionItemsDto {
  @IsArray()
  @IsString({ each: true })
  orderedIds!: string[]
}
