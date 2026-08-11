/*
 This is hand written graphql model of user, is fine for learning, will be swap out for prisma-nestjs-graphql later/irl 
*/

import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Post, User, Comment } from "@prisma/client";
import { PostGraphQLModelManual } from "../post/post.model";
import { CommentGraphQLModelManual } from "../comment/comment.model";

// type User {
//   id: ID!
//   name: String!
//   email: String!
//   avatar: String
//   posts: [Post!]!
//   comments: [Comment!]!
//   followers: [User!]!
//   following: [User!]!
// }
//

@ObjectType('User')
export class UserGraphQLModelManual {

    @Field(() => ID)
    id!: string;

    @Field(() => String)
    name!: string;

    @Field(() => String)
    email!: string;

    @Field(() => String)
    avatar!: string;

    @Field(() => [PostGraphQLModelManual])
    posts?: Post[];

    @Field(() => [CommentGraphQLModelManual])
    comments?: Comment[];

    @Field(() => [UserGraphQLModelManual])
    followers?: User[];

    @Field(() => [UserGraphQLModelManual])
    following?: User[];

    @Field(() => Date)
    createdAt!: Date

    @Field(() => Date)
    updatedAt!: Date
}