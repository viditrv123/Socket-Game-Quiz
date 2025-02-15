import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

class createUserDto {
  @IsNotEmpty()
  @IsString()
  userName: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export default createUserDto;
