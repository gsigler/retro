import { IsString } from 'class-validator'

export class InitBoardDto {
  @IsString()
  templateId!: string
}
