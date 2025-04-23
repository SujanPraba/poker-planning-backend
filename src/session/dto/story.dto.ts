import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StoryDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  jiraKey?: string;

  @IsOptional()
  initialEstimate?: string | number;
}