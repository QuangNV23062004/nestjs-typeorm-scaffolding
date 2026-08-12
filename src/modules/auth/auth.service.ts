import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/database/prisma.service';
import { Transactional } from 'src/common/database/transaction.context';
import { AccountRepository } from '../account/account.repository';
import { TypedConfigService } from 'src/common/typed-config/typed-config.service';
import { Status as AccountStatus } from '../account/enums/account-status.enum';

import { LoginDto } from './dtos/login.dto';
import { AuthException } from './exceptions/auth-exceptions.exceptions';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { AccountInfo } from 'src/interfaces/request';
import { Role } from '../account/enums/role.enum';
import { ResetPasswordTokenRepository } from '../reset-password-token/reset-password-token.repository';

import * as ejs from 'ejs';
import { VerifyResetPasswordTokenDto } from './dtos/verify-reset-password-token.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthJwtService } from './services/auth-jwt.service';
import { AuthEmailService } from './services/auth-email.service';
import { AuthTemplateService } from './services/auth-template.service';
@Injectable()
export class AuthService {
  constructor(
    private readonly typedConfigService: TypedConfigService,

    // Read by @Transactional() to open the transaction. It would otherwise fall
    // back to the client PrismaService registers on init, which works in the
    // running app but not in a test module compiled without .init().
    private readonly prisma: PrismaService,

    private readonly accountRepository: AccountRepository,

    private readonly resetPasswordTokenRepository: ResetPasswordTokenRepository,

    private readonly authPasswordService: AuthPasswordService,

    private readonly authJwtService: AuthJwtService,

    private readonly authEmailService: AuthEmailService,

    private readonly authTemplateService: AuthTemplateService,
  ) {}

  async Login(loginDto: LoginDto) {
    const account = await this.accountRepository.FindByEmailWithCredentials(
      loginDto.email,
      false,
    );
    if (!account) {
      throw AuthException.ACCOUNT_NOT_FOUND;
    }

    if (account.status === AccountStatus.INACTIVE) {
      throw AuthException.ACCOUNT_INACTIVE;
    }

    await this.authPasswordService.comparePasswords(
      loginDto.password,
      account.passwordHash,
    );

    const payload = {
      sub: account.id,
      role: account.role,
    };

    const accessToken = await this.authJwtService.createAccessToken(payload);

    const refreshToken = await this.authJwtService.createRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  async Refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw AuthException.REFRESH_TOKEN_NOT_FOUND;
    }
    let returnedRefreshToken = refreshToken;

    const decoded = await this.authJwtService.verifyRefreshToken(refreshToken);

    const payload = {
      sub: decoded.sub,
      role: decoded.role,
    };

    const accessToken = await this.authJwtService.createAccessToken(payload);

    //check refresh token remaining time, if less than 7 day => refresh
    if (decoded.exp * 1000 - Date.now() < 7 * 24 * 60 * 60) {
      returnedRefreshToken =
        await this.authJwtService.createRefreshToken(payload);
    }

    return { accessToken, refreshToken: returnedRefreshToken };
  }

  async GetAccountInfo(id: string) {
    return this.accountRepository.FindById(id, false);
  }

  @Transactional()
  async UpdatePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
    accountInfo?: AccountInfo,
  ): Promise<boolean> {
    await this.authPasswordService.isPasswordStrong(
      updatePasswordDto.newPassword,
    );

    const account = await this.accountRepository.FindByIdWithCredentials(
      id,
      false,
    );

    if (!account) {
      throw AuthException.ACCOUNT_NOT_FOUND;
    }

    const isOwner = accountInfo?.sub === id;

    const isAdmin = accountInfo?.role === Role.ADMIN;
    if (!isOwner && !isAdmin) {
      throw AuthException.INSUFFICIENT_PERMISSION;
    }

    if (!isAdmin) {
      await this.authPasswordService.comparePasswords(
        updatePasswordDto.currentPassword,
        account.passwordHash,
      );
    }

    if ((account.status = AccountStatus.NEED_CHANGE_PASSWORD)) {
      account.status = AccountStatus.ACTIVE;
    }

    const { salt, hash } = await this.authPasswordService.hashPassword(
      updatePasswordDto.newPassword,
    );

    return (
      this.accountRepository.Update(account.id, {
        passwordSalt: salt,
        passwordHash: hash,
        status: AccountStatus.ACTIVE,
      }) != null
    );
  }

  /**
   * Issues a reset token, then mails it.
   *
   * The send is deliberately outside the transaction. An SMTP round trip inside
   * one pins a pool connection for its whole duration and has to finish inside
   * Prisma's 5s transaction timeout, so a slow mail server turns into P2028 and
   * a rolled-back reset. Raising the timeout only widens the window.
   *
   * The remaining failure is ordered the safe way round: if the send fails the
   * token is already committed, so the user simply gets nothing and retries.
   * The reverse — mail sent, token rolled back — would hand them a link that is
   * guaranteed to fail.
   *
   * This is the one method here that keeps an explicit Transaction() block
   * rather than @Transactional(): the transaction has to be *narrower* than the
   * method, and a visible block says so where a method-level decorator would
   * quietly pull the send back inside. Repository calls within it still join
   * ambiently — BaseRepository.Transaction publishes the client to
   * AsyncLocalStorage — so nothing is threaded.
   */
  async ResetPassword(email: string): Promise<void> {
    const resetToken = await this.accountRepository.Transaction(async () => {
      const account = await this.accountRepository.FindByEmail(email, false);
      if (!account) {
        throw AuthException.ACCOUNT_NOT_FOUND;
      }

      const payload = {
        sub: account.id,
      };

      const token =
        await this.authJwtService.createResetPasswordToken(payload);

      const hash = await this.authPasswordService.hashToken(token);

      const resetPasswordTokenData: Prisma.ResetPasswordTokenCreateInput = {
        account: { connect: { id: account.id } },
        tokenHash: hash,
        expiresAt: new Date(
          Date.now() +
            this.authJwtService.parseExpiresIn(
              this.typedConfigService.jwt.resetPasswordExpiresIn,
            ),
        ),
        usable: true,
      };

      await this.resetPasswordTokenRepository.BatchUpdate(
        { accountId: account.id, usable: true },
        { usable: false },
      );

      await this.resetPasswordTokenRepository.Create(resetPasswordTokenData);

      return token;
    });

    const template =
      await this.authTemplateService.getResetPasswordEmailTemplate();

    await this.authEmailService.sendResetPasswordEmail(
      email,
      template,
      resetToken,
    );
  }

  async GetResetPasswordForm(token: string): Promise<string> {
    if (!token) {
      throw AuthException.INVALID_RESET_PASSWORD_TOKEN;
    }

    const decoded = await this.authJwtService.verifyResetPasswordToken(token);

    const resetPasswordTokens =
      await this.resetPasswordTokenRepository.FindActiveTokenByAccountId(
        decoded.sub,
      );

    if (!resetPasswordTokens) {
      throw AuthException.INVALID_RESET_PASSWORD_TOKEN;
    }

    //no need to validate time because jwt verify already do that
    await this.authJwtService.compareResetTokenHash(
      token,
      resetPasswordTokens.tokenHash,
    );

    const account = await this.accountRepository.FindById(decoded.sub, false);
    if (!account) {
      throw AuthException.ACCOUNT_NOT_FOUND;
    }

    const template =
      await this.authTemplateService.getResetPasswordFormTemplate();
    const rendered = ejs.render(template, {
      token,
      clientUrl:
        this.typedConfigService.client.url1 ||
        this.typedConfigService.client.url2,
      err: null,
    });

    return rendered;
  }

  @Transactional()
  async VerifyResetPasswordToken(
    verifyResetPasswordTokenDto: VerifyResetPasswordTokenDto,
  ): Promise<boolean> {
    const { token, password, confirmPassword } = verifyResetPasswordTokenDto;

    if (password !== confirmPassword) {
      throw AuthException.PASSWORD_NOT_MATCH;
    }

    await this.authPasswordService.isPasswordStrong(password);

    if (!token) {
      throw AuthException.INVALID_RESET_PASSWORD_TOKEN;
    }
    const decoded = await this.authJwtService.verifyResetPasswordToken(token);

    if (!decoded) {
      throw AuthException.INVALID_RESET_PASSWORD_TOKEN;
    }

    const resetPasswordTokens =
      await this.resetPasswordTokenRepository.FindActiveTokenByAccountId(
        decoded.sub,
      );

    if (!resetPasswordTokens) {
      throw AuthException.INVALID_RESET_PASSWORD_TOKEN;
    }

    //no need to validate time because jwt verify already do that
    await this.authJwtService.compareResetTokenHash(
      token,
      resetPasswordTokens.tokenHash,
    );

    // Previously threaded no tx, so this read ran outside the transaction.
    // It joins ambiently now.
    const account = await this.accountRepository.FindById(decoded.sub, false);
    if (!account) {
      throw AuthException.ACCOUNT_NOT_FOUND;
    }

    const { salt, hash } =
      await this.authPasswordService.hashPassword(password);

    await this.accountRepository.Update(account.id, {
      passwordSalt: salt,
      passwordHash: hash,
    });

    //invalidate the used token
    const result = await this.resetPasswordTokenRepository.Update(
      resetPasswordTokens.id,
      { usable: false },
    );
    return result != null;
  }
}
