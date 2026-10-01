import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { PASSWORD_REQUIREMENTS } from '../../common/constants';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(PASSWORD_REQUIREMENTS.MIN_LENGTH)
  password: string;
}
