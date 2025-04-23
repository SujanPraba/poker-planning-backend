import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StoryDto } from './story.dto';

export class CreateSessionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(['fibonacci', 'tshirt'])
  votingSystem: 'fibonacci' | 'tshirt';

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsOptional()
  @IsArray()
  initialStories?: StoryDto[];
}
