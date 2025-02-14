import {HttpException, Inject, Injectable} from '@nestjs/common';
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
        return jwt.sign({ id }, 'THE_SECREAT_KEY');
    }
    async createUser({userName, password}) {
        if (await this.userModel.exists({ userName })) {
            throw new HttpException('User already exists', 400);
        }

        const hashedPassword: string=await  this.createHash(password)

        return new this.userModel({userName, password: hashedPassword}).save()

    }
}
