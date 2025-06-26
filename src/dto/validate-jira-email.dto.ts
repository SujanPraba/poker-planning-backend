import { IsEmail, IsNotEmpty } from 'class-validator';

export class ValidateJiraEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}