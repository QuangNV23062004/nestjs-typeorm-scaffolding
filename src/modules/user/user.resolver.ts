import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { UserGraphQLModelManual } from './user.model';
import { Inject } from '@nestjs/common';
import { UserService } from './user.service';
import { Public } from 'src/decorators';

@Resolver()
export class UserResolver {
    constructor(@Inject() private readonly service: UserService) { }
    @Public()
    @Query(() => [UserGraphQLModelManual],
        { name: 'users' })
    async findUser(): Promise<UserGraphQLModelManual[]> {
        return await this.service.FindAll();
    }

    @ResolveField('Post')
    async resolvePost(@Parent() user: UserGraphQLModelManual) {

    }

}
