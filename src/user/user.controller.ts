import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import createUserDto from './dto';
import { AppGaurd } from '../core/gaurds/app.gaurd';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/createUser')
  createUser(@Body() dto: createUserDto): object {
    const { userName, password } = dto;
    return this.userService.createUser({ userName, password });
  }

  @Post('/login')
  login(@Body() dto: createUserDto): object {
    const { userName, password } = dto;
    return this.userService.login({ userName, password });
  }

  @UseGuards(AppGaurd)
  @Get('/check')
  check(): string {
    return 'Correct';
  }
}
