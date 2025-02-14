import {Body, Controller,  Post} from '@nestjs/common';
import {UserService} from "./user.service";
import createUserDto from "./dto";

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('/createUser')
    createUser(@Body() dto: createUserDto): object {
        const { userName, password } = dto;
        return this.userService.createUser({ userName, password });
    }
}
