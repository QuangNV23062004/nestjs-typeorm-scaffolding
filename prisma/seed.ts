/**
 * Dev/test seed data for the User -> Post -> Comment graph.
 *
 * Run with `npm run prisma:seed`. Idempotent: every row uses a fixed UUID and
 * is written with upsert, so re-running updates in place instead of piling up
 * duplicates. Fixed ids also mean you can paste a known id straight into a
 * GraphQL query while poking at resolvers.
 *
 * The shape is deliberately awkward in places, because a seed where every row
 * looks the same hides exactly the bugs seeds are supposed to surface:
 *
 *   - Diana authors nothing        -> empty relation lists, not just non-empty
 *   - "Draft: ..." has publishedAt null -> the nullable field the GraphQL model
 *                                     currently declares as non-null
 *   - one post and one user are soft-deleted -> isDeleted filtering has
 *                                     something to actually filter
 *   - comment counts per post vary  -> an N+1 shows up as uneven query counts
 *   - the follow graph is asymmetric-> A follows B does not imply B follows A
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { buildDatabaseUrl } from '../src/common/database/database-url';

const prisma = new PrismaClient({ adapter: new PrismaPg(buildDatabaseUrl()) });

/** Stable ids so seeded rows are quotable in queries and re-runs are updates. */
const USER = {
  alice: '11111111-1111-4111-8111-111111111111',
  bob: '22222222-2222-4222-8222-222222222222',
  carol: '33333333-3333-4333-8333-333333333333',
  diana: '44444444-4444-4444-8444-444444444444',
  erin: '55555555-5555-4555-8555-555555555555',
} as const;

const POST = {
  graphqlBasics: 'aaaaaaaa-0000-4000-8000-000000000001',
  dataloader: 'aaaaaaaa-0000-4000-8000-000000000002',
  prismaRelations: 'aaaaaaaa-0000-4000-8000-000000000003',
  draft: 'aaaaaaaa-0000-4000-8000-000000000004',
  tracing: 'aaaaaaaa-0000-4000-8000-000000000005',
  retracted: 'aaaaaaaa-0000-4000-8000-000000000006',
} as const;

const users = [
  { id: USER.alice, name: 'Alice Nguyen', email: 'alice@example.com', avatar: 'https://i.pravatar.cc/150?u=alice' },
  { id: USER.bob, name: 'Bob Tran', email: 'bob@example.com', avatar: 'https://i.pravatar.cc/150?u=bob' },
  { id: USER.carol, name: 'Carol Pham', email: 'carol@example.com', avatar: '' },
  // Authors nothing and comments on nothing: the empty-relation case.
  { id: USER.diana, name: 'Diana Le', email: 'diana@example.com', avatar: '' },
  // Soft-deleted: should never appear in a query that filters isDeleted.
  { id: USER.erin, name: 'Erin Vo', email: 'erin@example.com', avatar: '', isDeleted: true },
];

const posts = [
  {
    id: POST.graphqlBasics,
    title: 'What GraphQL actually solves',
    content: 'Over-fetching and under-fetching, and why REST versioning gets painful.',
    likes: 42,
    authorId: USER.alice,
    publishedAt: new Date('2026-07-01T09:00:00Z'),
  },
  {
    id: POST.dataloader,
    title: 'DataLoader is not a layer',
    content: 'It is a request-scoped batcher that wraps a call you already make.',
    likes: 17,
    authorId: USER.alice,
    publishedAt: new Date('2026-07-14T09:00:00Z'),
  },
  {
    id: POST.prismaRelations,
    title: 'Prisma relations without the entity layer',
    content: 'Generated types are the model. The repository is the boundary.',
    likes: 8,
    authorId: USER.bob,
    publishedAt: new Date('2026-07-20T09:00:00Z'),
  },
  {
    // publishedAt null. Post.publishedAt is currently `DateTime!` in the
    // GraphQL model, so querying this row is what makes that mismatch fail.
    id: POST.draft,
    title: 'Draft: subscriptions over websockets',
    content: 'Unfinished notes.',
    likes: 0,
    authorId: USER.bob,
    publishedAt: null,
  },
  {
    // Published but with zero comments: the empty-list case on the Post side.
    id: POST.tracing,
    title: 'Reading OpenTelemetry spans without drowning',
    content: 'One line per span beats a full ReadableSpan dump.',
    likes: 5,
    authorId: USER.carol,
    publishedAt: new Date('2026-08-02T09:00:00Z'),
  },
  {
    id: POST.retracted,
    title: 'Retracted: benchmark was wrong',
    content: 'Kept for history.',
    likes: 1,
    authorId: USER.carol,
    publishedAt: new Date('2026-06-11T09:00:00Z'),
    isDeleted: true,
  },
];

/** Uneven counts per post, so an N+1 shows as an uneven query count. */
const comments = [
  { id: 'cccccccc-0000-4000-8000-000000000001', text: 'This finally made fragments click.', authorId: USER.bob, postId: POST.graphqlBasics },
  { id: 'cccccccc-0000-4000-8000-000000000002', text: 'Any thoughts on persisted queries?', authorId: USER.carol, postId: POST.graphqlBasics },
  { id: 'cccccccc-0000-4000-8000-000000000003', text: 'Second this.', authorId: USER.alice, postId: POST.graphqlBasics },
  { id: 'cccccccc-0000-4000-8000-000000000004', text: 'The ordering guarantee bit me last week.', authorId: USER.carol, postId: POST.dataloader },
  { id: 'cccccccc-0000-4000-8000-000000000005', text: 'Keys must map 1:1, missing -> null.', authorId: USER.alice, postId: POST.dataloader },
  { id: 'cccccccc-0000-4000-8000-000000000006', text: 'How does this interact with transactions?', authorId: USER.alice, postId: POST.prismaRelations },
  // Soft-deleted comment on a live post.
  { id: 'cccccccc-0000-4000-8000-000000000007', text: 'Duplicate, ignore.', authorId: USER.bob, postId: POST.prismaRelations, isDeleted: true },
  // Comment by a soft-deleted author: joins can resurrect Erin if unfiltered.
  { id: 'cccccccc-0000-4000-8000-000000000008', text: 'Bookmarking this.', authorId: USER.erin, postId: POST.dataloader },
];

/** Asymmetric on purpose: follows is directional, mutual follows are a subset. */
const follows: Array<{ follower: string; following: string }> = [
  { follower: USER.bob, following: USER.alice },
  { follower: USER.carol, following: USER.alice },
  { follower: USER.diana, following: USER.alice },
  { follower: USER.alice, following: USER.bob }, // mutual with bob -> alice
  { follower: USER.carol, following: USER.bob },
  { follower: USER.alice, following: USER.carol },
];

async function main() {
  // Order matters: posts and comments carry FKs to users, comments to posts.
  for (const user of users) {
    await prisma.user.upsert({ where: { id: user.id }, create: user, update: user });
  }
  for (const post of posts) {
    await prisma.post.upsert({ where: { id: post.id }, create: post, update: post });
  }
  for (const comment of comments) {
    await prisma.comment.upsert({
      where: { id: comment.id },
      create: comment,
      update: comment,
    });
  }

  // `set` rather than `connect` so a re-run cannot accumulate stale edges.
  const followingByUser = new Map<string, string[]>();
  for (const { follower, following } of follows) {
    followingByUser.set(follower, [
      ...(followingByUser.get(follower) ?? []),
      following,
    ]);
  }
  for (const [follower, following] of followingByUser) {
    await prisma.user.update({
      where: { id: follower },
      data: { following: { set: following.map((id) => ({ id })) } },
    });
  }

  const [userCount, postCount, commentCount] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count(),
  ]);
  console.log(
    `seeded: ${userCount} users, ${postCount} posts, ${commentCount} comments, ${follows.length} follow edges`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
