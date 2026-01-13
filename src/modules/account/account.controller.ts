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
import { Roles } from 'src/decorators';
import { Role } from './enums/role.enum';

@Controller('account')
export class AccountController {
  constructor(@Inject() private readonly accountService: AccountService) {}

  @Get('by-email')
  async FindByEmail(@Query('email') email: string) {
    return this.accountService.FindByEmail(email);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Get('all')
  async FindAll(
    @Req() request: IAuthenticatedRequest,
    @Query('includeDeleted') includeDeleted?: boolean,
    @Query() filterAccountDto?: FilterAccountDto,
  ) {
    return this.accountService.FindAll(
      request.accountInfo,
      filterAccountDto,
      includeDeleted,
    );
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Get()
  async FindPaginated(
    @Req() request: IAuthenticatedRequest,
    @Query('includeDeleted') includeDeleted?: boolean,
    @Query() filterAccountDto?: FilterAccountDto,
  ) {
    return this.accountService.FindAll(
      request.accountInfo,
      filterAccountDto,
      includeDeleted,
    );
  }

  @Roles(Role.ADMIN, Role.ANNOTATOR, Role.MANAGER, Role.REVIEWER)
  @Get(':id')
  async FindById(
    @Param('id') id: string,
    @Req() request: IAuthenticatedRequest,
    @Query('includeDeleted') includeDeleted?: boolean,
  ) {
    return this.accountService.FindById(
      id,
      request.accountInfo,
      includeDeleted,
    );
  }

  @Roles(Role.ADMIN)
  @Post()
  async Create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountService.Create(createAccountDto);
  }

  @Roles(Role.ADMIN, Role.ANNOTATOR, Role.MANAGER, Role.REVIEWER)
  @Patch(':id')
  @Put(':id')
  async Update(
    @Param('id') id: string,
    @Req() request: IAuthenticatedRequest,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountService.Update(
      id,
      updateAccountDto,
      request.accountInfo,
    );
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async SoftDelete(
    @Param('id') id: string,
    @Req() request: IAuthenticatedRequest,
  ) {
    return this.accountService.SoftDelete(id, request.accountInfo);
  }

  @Roles(Role.ADMIN)
  @Post('restore/:id')
  async Restore(
    @Param('id') id: string,
    @Req() request: IAuthenticatedRequest,
  ) {
    return await this.accountService.Restore(id, request.accountInfo);
  }

  @Roles(Role.ADMIN)
  @Delete('hard/:id')
  async HardDelete(
    @Param('id') id: string,
    @Req() request: IAuthenticatedRequest,
  ) {
    return await this.accountService.HardDelete(id, request.accountInfo);
  }
}
