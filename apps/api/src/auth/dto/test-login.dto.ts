import { IsEmail, IsOptional, IsString } from 'class-validator'

export class TestLoginDto {
  @IsEmail()
  email!: string

  @IsString()
  @IsOptional()
  name?: string
}
