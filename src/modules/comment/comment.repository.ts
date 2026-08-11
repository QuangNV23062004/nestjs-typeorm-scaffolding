
import { Injectable } from "@nestjs/common";
import { FilterCommentDto } from "./dtos/filter-comment.dto";
import { Comment, Prisma } from '@prisma/client';
import { PaginationResultDto } from "src/common/pagination/pagination-result.dto";
import { paginated, resolvePaging } from "src/common/pagination/paginate";
import { PrismaService } from "src/common/database/prisma.service";
import { BaseRepository } from "src/common/database/base.repository";



const SORTABLE_FIELDS: Record<
    string,
    keyof Prisma.CommentOrderByWithRelationInput
> = {
    created_at: 'createdAt',
    createdAt: 'createdAt',
    updated_at: 'updatedAt',
    updatedAt: 'updatedAt',
};


@Injectable()
export class CommentRepository extends BaseRepository {
    // Redeclared so Nest emits design:paramtypes on the concrete class.
    constructor(prisma: PrismaService) {
        super(prisma);
    }

    /** Shared filter so FindAll and FindPaginated cannot drift apart. */
    private buildWhere(
        includeDeleted?: boolean,
        excludeId?: string,
        query?: FilterCommentDto,
    ): Prisma.CommentWhereInput {
        const where: Prisma.CommentWhereInput = excludeId ? {
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

        if (query?.postIds && query.postIds?.length > 0) {
            where.postId = { in: query?.postIds }
        }

        return where;
    }


    private buildOrderBy(
        query?: FilterCommentDto,
    ): Prisma.CommentOrderByWithRelationInput | undefined {
        if (!query?.orderBy || !query?.order) return undefined;

        const field = SORTABLE_FIELDS[query.orderBy];
        if (!field) return undefined;

        return { [field]: query.order.toLowerCase() as Prisma.SortOrder };
    }

    async FindAllComment(
        includeDeleted?: boolean,
        excludeId?: string,
        query?: FilterCommentDto,
        tx?: Prisma.TransactionClient
    ): Promise<Comment[]> {
        const where = this.buildWhere(includeDeleted, excludeId, query)
        const orderBy = this.buildOrderBy(query)
        return await this.db(tx).comment.findMany({ where, orderBy })
    }


    async FindCommentPaginated(
        includeDeleted?: boolean,
        excludeId?: string,
        query?: FilterCommentDto,
        tx?: Prisma.TransactionClient
    ): Promise<PaginationResultDto<Comment>> {
        const where = this.buildWhere(includeDeleted, excludeId, query)
        const orderBy = this.buildOrderBy(query)
        const { page, limit, skip, take } = resolvePaging(query)
        const [total, data] = await Promise.all([
            this.db(tx).comment.count({ where }),
            this.db(tx).comment.findMany({ where, orderBy, skip, take }),
        ])

        return paginated(data, total, page, limit, query)
    }

    async FindCommentById(
        id: string,
        includeDeleted?: boolean,
        tx?: Prisma.TransactionClient
    ): Promise<Comment | null> {
        const where: Prisma.CommentWhereInput = includeDeleted ? { id } : { id, isDeleted: false }
        return await this.db(tx).comment.findFirst({ where });
    }

    async FindCommentByIds(
        ids: string[],
        includeDeleted?: boolean,
        tx?: Prisma.TransactionClient
    ): Promise<Comment[]> {
        if (!ids || ids?.length === 0) return [];
        const where: Prisma.CommentWhereInput = { id: { in: ids } }
        if (!includeDeleted) {
            where.isDeleted = false
        }
        return await this.db(tx).comment.findMany({ where })
    }
}