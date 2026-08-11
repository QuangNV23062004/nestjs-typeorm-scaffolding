import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { BasePaginationQueryDto } from 'src/common/pagination/base-pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class FilterCommentDto extends BasePaginationQueryDto {
    @ApiPropertyOptional({ description: 'Search term', example: 'john' })
    @IsOptional()
    @IsString()
    search?: string = '';

    @ApiPropertyOptional({
        description: 'Fields to search by',
        isArray: true,
        enum: ['text'],
        default: ['text'],
    })
    @IsOptional()
    // `?searchBy=name` arrives as a string, `?searchBy=name&searchBy=email` as an
    // array. Normalise so both shapes validate as an array.
    @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
    @IsArray()
    @IsString({ each: true })
    @IsIn(['text'], { each: true })
    searchBy?: string[] = ['text'];

    @ApiPropertyOptional({
        description: 'Sort field',
        enum: ['text', 'created_at', 'updated_at'],
        default: 'created_at',
    })
    @IsOptional()
    @IsString()
    @IsIn(['created_at', 'updated_at'])
    orderBy?: string = 'created_at';


    @ApiPropertyOptional({
        description: 'AuthorIds',
        default: '',
    })
    @IsArray()
    @IsOptional()
    authorIds?: string[]


    @ApiPropertyOptional({
        description: 'PostIds',
        default: '',
    })
    @IsArray()
    @IsOptional()
    postIds?: string[]


}

