import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { BasePaginationQueryDto } from 'src/common/pagination/base-pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class FilterUserDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search term', example: 'john' })
  @IsOptional()
  @IsString()
  search?: string = '';

  @ApiPropertyOptional({
    description: 'Fields to search by',
    isArray: true,
    enum: ['email', 'name'],
    default: ['name'],
  })
  @IsOptional()
  // `?searchBy=name` arrives as a string, `?searchBy=name&searchBy=email` as an
  // array. Normalise so both shapes validate as an array.
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsString({ each: true })
  @IsIn(['email', 'name'], { each: true })
  searchBy?: string[] = ['name'];

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['name', 'email', 'created_at', 'updated_at'],
    default: 'created_at',
  })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'email', 'created_at', 'updated_at'])
  orderBy?: string = 'created_at';



}
