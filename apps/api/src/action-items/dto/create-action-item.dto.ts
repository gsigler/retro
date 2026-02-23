import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator'

export class CreateActionItemDto {
  @IsString()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string

  @IsString()
  @IsOptional()
  assigneeId?: string

  @IsDateString()
  @IsOptional()
  dueDate?: string
}
