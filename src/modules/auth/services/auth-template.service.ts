import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuthTemplateService {
  constructor() {}

  getResetPasswordEmailTemplate(): string {
    const templatePath = path.join(
      __dirname,
      '../templates/reset-password-email.template.ejs',
    );
    const template = fs.readFileSync(templatePath, 'utf8');
    return template;
  }

  getResetPasswordFormTemplate(): string {
    const templatePath = path.join(
      __dirname,
      '../templates/reset-password-form.template.ejs',
    );
    const template = fs.readFileSync(templatePath, 'utf8');
    return template;
  }
}
