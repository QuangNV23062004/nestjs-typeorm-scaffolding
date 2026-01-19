import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuthTemplateService {
  constructor() {}

  async getResetPasswordEmailTemplate(): Promise<string> {
    const templatePath = path.join(
      __dirname,
      '../../../common/templates/auth/reset-password-email.template.ejs',
    );
    const template = await fs.promises.readFile(templatePath, 'utf8');
    return template;
  }

  async getResetPasswordFormTemplate(): Promise<string> {
    const templatePath = path.join(
      __dirname,
      '../../../common/templates/auth/reset-password-form.template.ejs',
    );
    const template = await fs.promises.readFile(templatePath, 'utf8');
    return template;
  }
}
