import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
    constructor(@Inject() private readonly repo: UserRepository) {
    }
    async FindAll() {
        return await this.repo.FindAll()
    }

}
