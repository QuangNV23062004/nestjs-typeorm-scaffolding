import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { AccountInfo } from 'src/interfaces/request/authenticated-request.interface';
import { AccountEntity } from './account.entity';
import { Role } from './enums/role.enum';
import { FilterAccountDto } from './dtos/filter-account.dto';
import { PaginationResultDto } from 'src/common/pagination/pagination-result.dto';
import { CreateAccountDto } from './dtos/create-account.dto';
import { Status } from './enums/account-status.enum';
import * as bcrypt from 'bcrypt';
import { UpdateAccountDto } from './dtos/update-account.dto';
import { AccountException } from './exceptions/account-exceptions.exceptions';

@Injectable()
export class AccountService {
  constructor(
    @Inject()
    private readonly accountRepository: AccountRepository,
  ) {}

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
    if (accountInfo?.sub !== id && accountInfo?.role !== Role.ADMIN) {
      throw AccountException.INSUFFICIENT_PERMISSION;
    }
  }

  private async createPasswordHash(
    password: string,
  ): Promise<{ passwordHash: string; passwordSalt: string }> {
    const salt = await bcrypt.genSalt(10);

    const hash = await bcrypt.hash(password, salt);

    return { passwordHash: hash, passwordSalt: salt };
  }

  async FindByEmail(
    email: string,
    accountInfo?: AccountInfo,
    includeDeleted?: boolean,
  ): Promise<AccountEntity> {
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

    return account;
  }

  async FindAll(
    accountInfo?: AccountInfo,
    query?: FilterAccountDto,
    includeDeleted?: boolean,
  ): Promise<AccountEntity[]> {
    let safeIncludedDeleted: boolean = this.getIncludeDeleted(
      accountInfo,
      includeDeleted,
    );

    return this.accountRepository.FindAll(safeIncludedDeleted, query);
  }

  async FindPaginated(
    accountInfo?: AccountInfo,
    query?: FilterAccountDto,
    includeDeleted?: boolean,
  ): Promise<PaginationResultDto<AccountEntity>> {
    let safeIncludedDeleted: boolean = this.getIncludeDeleted(
      accountInfo,
      includeDeleted,
    );

    return this.accountRepository.FindPaginated(safeIncludedDeleted, query);
  }

  async FindById(
    id: string,
    accountInfo?: AccountInfo,
    includeDeleted?: boolean,
  ): Promise<AccountEntity> {
    let safeIncludedDeleted: boolean = this.getIncludeDeleted(
      accountInfo,
      includeDeleted,
    );

    const account = await this.accountRepository.FindById(
      id,
      safeIncludedDeleted,
    );
    if (!account) {
      throw AccountException.ACCOUNT_NOT_FOUND;
    }
    return account;
  }

  async Create(account: CreateAccountDto): Promise<AccountEntity> {
    const existingAccount = await this.accountRepository.FindByEmail(
      account.email,
      false,
    );

    if (existingAccount) {
      throw AccountException.EMAIL_IN_USE;
    }

    const { passwordHash, passwordSalt } =
      await this.createPasswordHash('123456');

    const accountEntity: Partial<AccountEntity> = {
      email: account.email,
      username: account.username,
      role: account.role,
      passwordHash: passwordHash,
      passwordSalt: passwordSalt,
      status: Status.NEED_CHANGE_PASSWORD,
    };
    return this.accountRepository.Create(accountEntity as AccountEntity);
  }

  async Update(
    id: string,
    updateAccountDto: UpdateAccountDto,
    accountInfo?: AccountInfo,
  ): Promise<AccountEntity> {
    this.checkPermission(id, accountInfo);

    const account = await this.accountRepository.FindById(id, false);

    if (!account) {
      throw AccountException.ACCOUNT_NOT_FOUND;
    }

    if (updateAccountDto.email && updateAccountDto.email !== account.email) {
      account.email = updateAccountDto.email;
    }

    if (
      updateAccountDto.username &&
      updateAccountDto.username !== account.username
    ) {
      account.username = updateAccountDto.username;
    }

    if (updateAccountDto.role && accountInfo?.role !== Role.ADMIN) {
      throw AccountException.INSUFFICIENT_PERMISSION;
    }

    if (updateAccountDto.role && updateAccountDto.role !== account.role) {
      account.role = updateAccountDto.role;
    }

    if (updateAccountDto.password) {
      const { passwordHash, passwordSalt } = await this.createPasswordHash(
        updateAccountDto.password,
      );
      account.passwordHash = passwordHash;
      account.passwordSalt = passwordSalt;

      if (account.status === Status.NEED_CHANGE_PASSWORD) {
        account.status = Status.ACTIVE;
      }
    }

    return this.accountRepository.Update(account);
  }

  async SoftDelete(id: string, accountInfo?: AccountInfo): Promise<void> {
    this.checkPermission(id, accountInfo);

    const account = await this.accountRepository.FindById(id, false);
    if (!account) {
      throw AccountException.ACCOUNT_NOT_FOUND;
    }

    await this.accountRepository.SoftDelete(id);
  }

  async Restore(id: string, accountInfo?: AccountInfo): Promise<void> {
    this.checkPermission(id, accountInfo);

    const account = await this.accountRepository.FindById(id, true);

    if (!account) {
      throw AccountException.ACCOUNT_NOT_FOUND;
    }

    await this.accountRepository.Restore(id);
  }

  async HardDelete(id: string, accountInfo?: AccountInfo): Promise<void> {
    this.checkPermission(id, accountInfo);
    const account = await this.accountRepository.FindById(id, true);

    if (!account) {
      throw AccountException.ACCOUNT_NOT_FOUND;
    }

    await this.accountRepository.HardDelete(id);
  }
}
