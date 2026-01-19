import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('error_logs')
export class ErrorLogsEntity extends BaseEntity {
  @Column({ type: 'int', nullable: true })
  statusCode: number;
  @Column({ type: 'varchar', length: 10, nullable: true })
  method: string;
  @Column({ type: 'varchar', length: 255, nullable: true })
  url: string;
  @Column({ type: 'json', nullable: true })
  params: Record<string, any>;
  @Column({ type: 'json', nullable: true })
  query: Record<string, any>;
  @Column({ type: 'json', nullable: true })
  body: Record<string, any>;
  @Column({ type: 'json', nullable: true })
  accountInfo: Record<string, any>;
  @Column({ type: 'text', nullable: true })
  message: string;
}
