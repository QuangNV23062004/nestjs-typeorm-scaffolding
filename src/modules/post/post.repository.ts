import { Injectable } from "@nestjs/common";
import { Post, Prisma } from "@prisma/client";
import { FilterPostDto } from "./dtos/filter-posts.dto";
import { PaginationResultDto } from "src/common/pagination/pagination-result.dto";
import { paginated, resolvePaging } from "src/common/pagination/paginate";
import { PrismaService } from "src/common/database/prisma.service";
import { BaseRepository } from "src/common/database/base.repository";


const SORTABLE_FIELDS: Record<
    string,
    keyof Prisma.PostOrderByWithRelationInput
> = {
    title: 'title',
    created_at: 'createdAt',
    createdAt: 'createdAt',
    updated_at: 'updatedAt',
    updatedAt: 'updatedAt',
};


@Injectable()
export class PostRepository extends BaseRepository {
    // Redeclared so Nest emits design:paramtypes on the concrete class.
    constructor(prisma: PrismaService) {
        super(prisma);
    }

    /** Shared filter so FindAll and FindPaginated cannot drift apart. */
    private buildWhere(
        includeDeleted?: boolean,
        excludeId?: string,
        query?: FilterPostDto,
    ): Prisma.PostWhereInput {
        const where: Prisma.PostWhereInput = excludeId ? {
            id: { not: excludeId },
        } : {};



        if (!includeDeleted) {
            where.isDeleted = false;
        }

        const searchBy = query?.searchBy;
        const search = query?.search?.trim();
        if (
            search &&
            searchBy
        ) {
            if (searchBy.length > 0) {
                where.OR = searchBy.map((field) => ({
                    [field]: { contains: search, mode: 'insensitive' },
                }));
            }
        }

        if (query?.authorIds && query?.authorIds.length > 0) {
            where.authorId = {
                in: query.authorIds
            }
        }

        return where;
    }


    private buildOrderBy(
        query?: FilterPostDto,
    ): Prisma.PostOrderByWithRelationInput | undefined {
        if (!query?.orderBy || !query?.order) return undefined;

        const field = SORTABLE_FIELDS[query.orderBy];
        if (!field) return undefined;

        return { [field]: query.order.toLowerCase() as Prisma.SortOrder };
    }


    async FindAllPosts(
        includeDeleted?: boolean,
        excludeId?: string,
        query?: FilterPostDto,
        tx?: Prisma.TransactionClient
    ): Promise<Post[]> {
        const where = this.buildWhere(includeDeleted, excludeId, query)
        const orderBy = this.buildOrderBy(query);
        return await this.db(tx).post.findMany({ where, orderBy });
    }

    async FindPostsPaginated(
        includeDeleted?: boolean,
        excludeId?: string,
        query?: FilterPostDto,
        tx?: Prisma.TransactionClient
    ): Promise<PaginationResultDto<Post>> {
        const where = this.buildWhere(includeDeleted, excludeId, query)
        const orderBy = this.buildOrderBy(query);
        const { page, limit, skip, take } = resolvePaging(query)
        const [total, data] = await Promise.all([
            this.db(tx).post.count({ where }),
            this.db(tx).post.findMany({ where, orderBy, skip, take }),
        ])

        return paginated(data, total, page, limit, query)
    }

    async FindPostsById(
        id: string,
        includeDeleted?: boolean,
        tx?: Prisma.TransactionClient
    ): Promise<Post | null> {
        const where: Prisma.PostWhereInput = includeDeleted ? { id } : { id, isDeleted: false }
        return await this.db(tx).post.findFirst({ where })

    }

    async FindPostByIds(
        ids: string[],
        includeDeleted?: boolean,
        tx?: Prisma.TransactionClient
    ): Promise<Post[]> {
        if (!ids || ids.length === 0) return []
        const where: Prisma.PostWhereInput = { id: { in: ids } }
        if (!includeDeleted) {
            where.isDeleted = false
        }
        return await this.db(tx).post.findMany({ where })
    }
}