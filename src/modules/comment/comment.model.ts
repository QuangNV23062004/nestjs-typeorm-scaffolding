/*
// type Comment {
//   id: ID!
//   text: String!
//   author: User!
//   post: Post!
// }

model Comment {
  id        String   @id @default(uuid()) @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  isDeleted Boolean  @default(false) @map("is_deleted")

  text String

  author   User   @relation(fields: [authorId], references: [id])
  authorId String @map("author_id") @db.Uuid

  // Deleting a post removes its comments; an orphaned comment has no meaning.
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId String @map("post_id") @db.Uuid

  @@index([postId])
  @@index([authorId])
  @@map("comments")
}
 */

import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Post, User } from "@prisma/client";
import { UserGraphQLModelManual } from "../user/user.model";
import { PostGraphQLModelManual } from "../post/post.model";

@ObjectType('Comment')
export class CommentGraphQLModelManual {
  @Field(() => ID)
  id!: string


  @Field(() => Date)
  createdAt!: Date

  @Field(() => Date)
  updatedAt!: Date

  @Field(() => String)
  text!: String

  @Field(() => UserGraphQLModelManual)
  author!: User

  @Field(() => PostGraphQLModelManual)
  post!: Post


}