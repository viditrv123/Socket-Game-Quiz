import {HttpException, Inject, Injectable} from '@nestjs/common';
import { Model } from 'mongoose';
import {UserDocument, User} from "../model/User.model";
import {InjectModel} from "@nestjs/mongoose";

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

    async createUser({userName, password}) {
        if (await this.userModel.exists({ userName })) {
            throw new HttpException('User already exists', 400);
        }

        const createdUser = new this.userModel({userName, password});
        return createdUser.save();
    }
}
