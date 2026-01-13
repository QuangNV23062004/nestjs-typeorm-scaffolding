import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountRepository } from '../account/account.repository';
import { TypedConfigService } from 'src/common/typed-config/typed-config.service';
import { Status as AccountStatus } from '../account/enums/account-status.enum';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import { LoginDto } from './dtos/login.dto';
import { AuthException } from './exceptions/auth-exceptions.exceptions';

@Injectable()
export class AuthService {
  constructor(
    @Inject()
    private readonly jwtService: JwtService,
    @Inject()
    private readonly typedConfigService: TypedConfigService,
    @Inject()
    private readonly accountRepository: AccountRepository,
  ) {}

  async Login(loginDto: LoginDto) {
    const account = await this.accountRepository.FindByEmail(
      loginDto.email,
      false,
    );
    if (!account) {
      throw AuthException.ACCOUNT_NOT_FOUND;
    }

    if (account.status === AccountStatus.INACTIVE) {
      throw AuthException.ACCOUNT_INACTIVE;
    }

    const passwordValid = await bcrypt.compare(
      loginDto.password,
      account.passwordHash,
    );
    if (!passwordValid) {
      throw AuthException.INVALID_PASSWORD;
    }

    const payload = {
      sub: account.id,
      role: account.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      algorithm: 'RS256',
      privateKey: this.typedConfigService.jwt.privateAccessKey as jwt.Secret,
      expiresIn: this.typedConfigService.jwt
        .accessExpiresIn as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      algorithm: 'RS256',
      privateKey: this.typedConfigService.jwt.privateRefreshKey as jwt.Secret,
      expiresIn: this.typedConfigService.jwt
        .refreshExpiresIn as jwt.SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }

  async Refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw AuthException.REFRESH_TOKEN_NOT_FOUND;
    }
    let returnedRefreshToken = refreshToken;

    let decoded;
    try {
      decoded = await this.jwtService.verifyAsync(refreshToken, {
        algorithms: ['RS256'],
        publicKey: this.typedConfigService.jwt.publicRefreshKey as string,
      });
      if (!decoded) {
        throw AuthException.INVALID_REFRESH_TOKEN;
      }
    } catch (error) {
      throw AuthException.INVALID_REFRESH_TOKEN;
    }

    const payload = {
      sub: decoded.sub,
      role: decoded.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      algorithm: 'RS256',
      privateKey: this.typedConfigService.jwt.privateAccessKey as jwt.Secret,
      expiresIn: this.typedConfigService.jwt
        .accessExpiresIn as jwt.SignOptions['expiresIn'],
    });

    //check refresh token remaining time, if less than 7 day => refresh
    if (decoded.exp * 1000 - Date.now() < 7 * 24 * 60 * 60) {
      returnedRefreshToken = await this.jwtService.signAsync(payload, {
        algorithm: 'RS256',
        privateKey: this.typedConfigService.jwt.privateRefreshKey as jwt.Secret,
        expiresIn: this.typedConfigService.jwt
          .refreshExpiresIn as jwt.SignOptions['expiresIn'],
      });
    }

    return { accessToken, refreshToken: returnedRefreshToken };
  }

  async GetAccountInfo(id: string) {
    return this.accountRepository.FindById(id, false);
  }
}
