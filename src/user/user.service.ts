import {HttpException, Inject, Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import { Model } from 'mongoose';
import {UserDocument, User} from "../model/User.model";
import {InjectModel} from "@nestjs/mongoose";
import * as argon from 'argon2';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

    async createHash(password: string): Promise<string> {
        return argon.hash(password);
    }

    async createAuthToken({ id }: { id: string }): Promise<string> {
        return jwt.sign({ id }, process.env.JWT_SECRET);
    }
    async createUser({userName, password}) {
        if (await this.userModel.exists({ userName })) {
            throw new HttpException('User already exists', 400);
        }

        const hashedPassword: string=await  this.createHash(password)

        return new this.userModel({userName, password: hashedPassword}).save()

    }

    async login({userName, password}: { userName: string; password: string; }): Promise<object> {

        const user= await this.userModel.findOne({ userName });
        if (!user) throw new NotFoundException('User does not exist');
        if (await argon.verify(user.password, password)) {
            const token: string = await this.createAuthToken({ id: user.id });
            return {
                statusCode: 200, // 200 OK
                message: 'Login successful',
                token,
                user: {
                    userName,
                },
            };
        }
        throw new UnauthorizedException('Wrong credentials');
    }
}
