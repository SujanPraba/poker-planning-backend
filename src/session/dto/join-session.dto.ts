
import { IsNotEmpty, IsString } from 'class-validator';

export class JoinSessionDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsNotEmpty()
  @IsString()
  username: string;
}
