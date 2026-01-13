import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class BasePaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  order?: string = 'DESC';
}
