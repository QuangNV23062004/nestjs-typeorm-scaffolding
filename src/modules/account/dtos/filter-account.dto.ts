import { IsIn, IsOptional, IsString } from 'class-validator';
import { BasePaginationQueryDto } from 'src/common/pagination/base-pagination.dto';

export class FilterAccountDto extends BasePaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string = '';

  @IsOptional()
  @IsString()
  @IsIn(['username', 'email', 'role', 'status'])
  searchBy?: string = 'username';

  @IsOptional()
  @IsString()
  @IsIn(['username', 'email', 'created_at', 'updated_at'])
  orderBy?: string = 'created_at';
}
