/*
// type Post {
//   id: ID!
//   title: String!
//   content: String!
//   author: User!
//   comments: [Comment!]!
//   likes: Int!
//   publishedAt: String
// }

model Post {
  id        String   @id @default(uuid()) @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  isDeleted Boolean  @default(false) @map("is_deleted")

  title   String
  content String
  likes   Int    @default(0)

  // FK side: holds the column, so it carries fields/references.
  author   User   @relation(fields: [authorId], references: [id])
  authorId String @map("author_id") @db.Uuid

  // List side: never takes fields/references.
  comments Comment[]

  publishedAt DateTime? @map("published_at") @db.Timestamptz(6)

  @@index([authorId])
  @@map("posts")
}
 */

import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import { Comment, User } from "@prisma/client";
import { UserGraphQLModelManual } from "../user/user.model";
import { CommentGraphQLModelManual } from "../comment/comment.model";

@ObjectType('Post')
export class PostGraphQLModelManual {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  title!: string

  @Field(() => String)
  content!: string

  @Field(() => Int)
  likes!: number

  @Field(() => UserGraphQLModelManual)
  author!: User

  @Field(() => [CommentGraphQLModelManual])
  comments?: Comment[]

  @Field(() => Date, { nullable: true })
  publishedAt?: Date

  @Field(() => Date)
  createdAt!: Date

  @Field(() => Date)
  updatedAt!: Date
}