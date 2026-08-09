import { Query, Resolver } from '@nestjs/graphql';
import { Public } from './decorators';

/**
 * Placeholder root query.
 *
 * Code-first GraphQL builds the schema from decorators, and a schema with no
 * Query root is invalid — so the app cannot boot until at least one @Query
 * exists. Replace or delete this once real resolvers land.
 */
@Resolver()
export class AppResolver {
  @Public()
  @Query(() => String, { description: 'Liveness probe.' })
  health(): string {
    return 'ok';
  }
}
