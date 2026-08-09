/**
 * Shared shape for every persisted record.
 *
 * Prisma has no model inheritance, so these four fields are repeated in each
 * model in the *.prisma files. This class is the TypeScript-side counterpart:
 * it exists so entities stay real classes, which ClassSerializerInterceptor
 * needs in order to honour @Exclude() (Prisma returns plain objects).
 */
export abstract class BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
