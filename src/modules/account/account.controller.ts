import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { FilterAccountDto } from './dtos';
import { IAuthenticatedRequest } from 'src/interfaces/request/authenticated-request.interface';
import { CreateAccountDto } from './dtos';
import { UpdateAccountDto } from './dtos';
import { Public, Roles } from 'src/decorators';
import { Role } from './enums/role.enum';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Account')
@ApiBearerAuth()
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Find Account by Email' })
  @ApiQuery({
    name: 'email',
    required: true,
    description: 'Email to search for',
  })
  @ApiResponse({ status: 200, description: 'Account found' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Get('email')
  async FindByEmail(@Query('email') email: string) {
    return await this.accountService.FindByEmail(email);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get All Accounts (List)' })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Include soft-deleted accounts',
  })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  @Roles(Role.ADMIN, Role.MANAGER)
  @Get('all')
  async FindAll(
    @Req() request: IAuthenticatedRequest,
    @Query('includeDeleted') includeDeleted?: boolean,
    @Query() filterAccountDto?: FilterAccountDto,
  ) {
    return await this.accountService.FindAll(
      request.accountInfo,
      filterAccountDto,
      includeDeleted,
    );
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get All Accounts (Paginated)' })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Include soft-deleted accounts',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of accounts' })
  @Roles(Role.ADMIN, Role.MANAGER)
  @Get()
  async FindPaginated(
    @Req() request: IAuthenticatedRequest,
    @Query('includeDeleted') includeDeleted?: boolean,
    @Query() filterAccountDto?: FilterAccountDto,
  ) {
    return await this.accountService.FindPaginated(
      request.accountInfo,
      filterAccountDto,
      includeDeleted,
    );
  }

  @ApiOperation({ summary: 'Find Account by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Account ID' })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Include soft-deleted accounts',
  })
  @ApiResponse({ status: 200, description: 'Account found' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Roles(Role.ADMIN, Role.ANNOTATOR, Role.MANAGER, Role.REVIEWER)
  @Get(':id')
  async FindById(
    @Param('id') id: string,
    @Req() request: IAuthenticatedRequest,
    @Query('includeDeleted') includeDeleted?: boolean,
  ) {
    return await this.accountService.FindById(
      id,
      request.accountInfo,
      includeDeleted,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new Account' })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({ status: 201, description: 'Account created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Roles(Role.ADMIN)
  @Post()
  async Create(@Body() createAccountDto: CreateAccountDto) {
    return await this.accountService.Create(createAccountDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Account' })
  @ApiParam({ name: 'id', required: true, description: 'Account ID to update' })
  @ApiBody({ type: UpdateAccountDto })
  @ApiResponse({ status: 200, description: 'Account updated' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Patch(':id')
  async Update(
    @Param('id') id: string,
    @Req() request: IAuthenticatedRequest,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return await this.accountService.Update(
      id,
      updateAccountDto,
      request.accountInfo,
    );
  }

  @ApiOperation({ summary: 'Soft Delete Account' })
  @ApiParam({ name: 'id', required: true, description: 'Account ID to delete' })
  @ApiResponse({ status: 200, description: 'Account soft deleted' })
  @Roles(Role.ADMIN)
  @Delete(':id')
  async Delete(
    @Param('id') id: string,
    @Req() request: IAuthenticatedRequest,
    @Query('type') type: 'soft' | 'hard' = 'soft',
  ) {
    if (type === 'hard') {
      return await this.accountService.HardDelete(id, request.accountInfo);
    }
    return await this.accountService.SoftDelete(id, request.accountInfo);
  }

  @ApiOperation({ summary: 'Restore Account' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Account ID to restore',
  })
  @ApiResponse({ status: 200, description: 'Account restored' })
  @Roles(Role.ADMIN)
  @Patch('restore/:id')
  async Restore(
    @Param('id') id: string,
    @Req() request: IAuthenticatedRequest,
  ) {
    return await this.accountService.Restore(id, request.accountInfo);
  }

  @Public()
  @ApiOperation({ summary: 'Bootstrap Admin Account' })
  @Post('bootstrap')
  async BootstrapAdminAccount() {
    return await this.accountService.BootstrapAdminAccount();
  }
}
