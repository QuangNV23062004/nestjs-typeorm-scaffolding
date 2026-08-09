import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { AccountInfo } from 'src/interfaces/request/authenticated-request.interface';
import { Prisma } from '@prisma/client';
import { SafeAccount } from './account.repository';
import { Role } from './enums/role.enum';
import { FilterAccountDto } from './dtos/filter-account.dto';
import { PaginationResultDto } from 'src/common/pagination/pagination-result.dto';
import { CreateAccountDto } from './dtos/create-account.dto';
import { Status } from './enums/account-status.enum';
import * as bcrypt from 'bcrypt';
import { UpdateAccountDto } from './dtos/update-account.dto';
import { AccountException } from './exceptions/account-exceptions.exceptions';
import { AuthPasswordService } from '../auth/services/auth-password.service';

@Injectable()
export class AccountService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly authPasswordService: AuthPasswordService,
  ) {}

  private getAllowedRoles(accountInfo?: AccountInfo): Role[] {
    if (accountInfo?.role === Role.ADMIN) {
      return [Role.ADMIN, Role.MANAGER, Role.ANNOTATOR, Role.REVIEWER];
    } else if (accountInfo?.role === Role.MANAGER) {
      return [Role.ANNOTATOR, Role.REVIEWER];
    } else {
      return [];
    }
  }

  private getIncludeDeleted(
    accountInfo?: AccountInfo,
    includeDeleted?: boolean,
  ) {
    let safeIncludedDeleted: boolean = false;
    if (
      accountInfo &&
      accountInfo.role === Role.ADMIN &&
      includeDeleted !== false
    ) {
      safeIncludedDeleted = true;
    }
    return safeIncludedDeleted;
  }

  private checkPermission(id: string, accountInfo?: AccountInfo) {
    if (
      accountInfo?.sub !== id &&
      accountInfo?.role !== Role.ADMIN &&
      accountInfo?.role !== Role.MANAGER
    ) {
      throw AccountException.INSUFFICIENT_PERMISSION;
    }
  }

  async FindByEmail(
    email: string,
    accountInfo?: AccountInfo,
    includeDeleted?: boolean,
  ): Promise<SafeAccount> {
    let safeIncludedDeleted: boolean = this.getIncludeDeleted(
      accountInfo,
      includeDeleted,
    );

    const account = await this.accountRepository.FindByEmail(
      email,
      safeIncludedDeleted,
    );

    if (!account) {
      throw AccountException.ACCOUNT_NOT_FOUND;
    }

    if (accountInfo?.role !== Role.ADMIN && account.role === Role.ADMIN) {
      throw AccountException.ACCOUNT_NOT_FOUND;
    }

    return account;
  }

  async FindAll(
    accountInfo?: AccountInfo,
    query?: FilterAccountDto,
    includeDeleted?: boolean,
  ): Promise<SafeAccount[]> {
    let safeIncludedDeleted: boolean = this.getIncludeDeleted(
      accountInfo,
      includeDeleted,
    );

    const role = this.getAllowedRoles(accountInfo);
    return this.accountRepository.FindAll(
      safeIncludedDeleted,
      accountInfo?.sub as string,
      role,
      query,
    );
  }

  async FindPaginated(
    accountInfo?: AccountInfo,
    query?: FilterAccountDto,
    includeDeleted?: boolean,
  ): Promise<PaginationResultDto<SafeAccount>> {
    let safeIncludedDeleted: boolean = this.getIncludeDeleted(
      accountInfo,
      includeDeleted,
    );

    const role = this.getAllowedRoles(accountInfo);
    return this.accountRepository.FindPaginated(
      safeIncludedDeleted,
      accountInfo?.sub as string,
      role,
      query,
    );
  }

  async FindById(
    id: string,
    accountInfo?: AccountInfo,
    includeDeleted?: boolean,
  ): Promise<SafeAccount> {
    let safeIncludedDeleted: boolean = this.getIncludeDeleted(
      accountInfo,
      includeDeleted,
    );

    const account = await this.accountRepository.FindById(
      id,
      safeIncludedDeleted,
    );

    if (accountInfo?.role !== Role.ADMIN && account?.role === Role.ADMIN) {
      throw AccountException.ACCOUNT_NOT_FOUND;
    }

    if (!account) {
      throw AccountException.ACCOUNT_NOT_FOUND;
    }
    return account;
  }

  async Create(account: CreateAccountDto): Promise<SafeAccount> {
    const existingAccount = await this.accountRepository.FindByEmail(
      account.email,
      false,
    );

    if (existingAccount) {
      throw AccountException.EMAIL_IN_USE;
    }

    const { hash, salt } =
      await this.authPasswordService.hashPassword('123456');

    const accountEntity: Prisma.AccountCreateInput = {
      email: account.email,
      username: account.username,
      role: account.role,
      passwordHash: hash,
      passwordSalt: salt,
      status: Status.NEED_CHANGE_PASSWORD,
    };
    return this.accountRepository.Create(accountEntity);
  }

  async Update(
    id: string,
    updateAccountDto: UpdateAccountDto,
    accountInfo?: AccountInfo,
  ): Promise<SafeAccount> {
    this.checkPermission(id, accountInfo);

    const account = await this.accountRepository.FindById(id, false);

    if (!account) {
      throw AccountException.ACCOUNT_NOT_FOUND;
    }

    // Prevent non-admins from updating admin accounts
    if (accountInfo?.role !== Role.ADMIN && account.role === Role.ADMIN) {
      throw AccountException.INSUFFICIENT_PERMISSION;
    }

    // Build an explicit patch of only what actually changed, rather than
    // mutating the fetched row — Prisma updates take a data object, and this
    // keeps the write surface visible at the call site.
    const data: Prisma.AccountUpdateInput = {};

    if (updateAccountDto.email && updateAccountDto.email !== account.email) {
      data.email = updateAccountDto.email;
    }

    if (
      updateAccountDto.username &&
      updateAccountDto.username !== account.username
    ) {
      data.username = updateAccountDto.username;
    }

    if (updateAccountDto.role && accountInfo?.role !== Role.ADMIN) {
      throw AccountException.INSUFFICIENT_PERMISSION;
    }

    if (updateAccountDto.role && updateAccountDto.role !== account.role) {
      data.role = updateAccountDto.role;
    }

    if (
      updateAccountDto.status &&
      updateAccountDto.status !== account.status &&
      accountInfo?.role !== Role.ADMIN
    ) {
      throw AccountException.INSUFFICIENT_PERMISSION;
    }

    if (updateAccountDto.status && updateAccountDto.status !== account.status) {
      data.status = updateAccountDto.status;
    }

    return this.accountRepository.Update(id, data);
  }

  async SoftDelete(id: string, accountInfo?: AccountInfo): Promise<boolean> {
    this.checkPermission(id, accountInfo);

    const account = await this.accountRepository.FindById(id, false);
    if (!account) {
      throw AccountException.ACCOUNT_NOT_FOUND;
    }

    return await this.accountRepository.SoftDelete(id);
  }

  async Restore(id: string, accountInfo?: AccountInfo): Promise<boolean> {
    this.checkPermission(id, accountInfo);

    const account = await this.accountRepository.FindById(id, true);

    if (!account) {
      throw AccountException.ACCOUNT_NOT_FOUND;
    }

    return await this.accountRepository.Restore(id);
  }

  async HardDelete(id: string, accountInfo?: AccountInfo): Promise<boolean> {
    this.checkPermission(id, accountInfo);
    const account = await this.accountRepository.FindById(id, true);

    if (!account) {
      throw AccountException.ACCOUNT_NOT_FOUND;
    }

    return await this.accountRepository.HardDelete(id);
  }

  async BootstrapAdminAccount(): Promise<void> {
    const users = await this.FindAll();
    let createAdmin = false;
    if (users.length === 0) {
      createAdmin = true;
    }

    if (users.find((user) => user.role === Role.ADMIN)) {
      createAdmin = false;
    }
    if (createAdmin) {
      const { hash, salt } =
        await this.authPasswordService.hashPassword('123456');

      const adminAccount: Prisma.AccountCreateInput = {
        email: 'admin@example.com',
        username: 'admin',
        role: Role.ADMIN,
        passwordHash: hash,
        passwordSalt: salt,
        status: Status.NEED_CHANGE_PASSWORD,
      };

      await this.accountRepository.Create(adminAccount);
      return;
    }

    return;
  }
}
