import { Request } from 'express';

export const extractAccessToken = (request: Request): string | undefined => {
  let returnedToken = request?.cookies?.['AccessToken'];
  if (returnedToken) {
    return returnedToken;
  }
  const [type, token] = request?.headers?.authorization?.split(' ') ?? [];
  returnedToken = type === 'Bearer' ? token : undefined;

  return returnedToken;
};

export const extractRefreshToken = (request: Request): string | undefined => {
  let returnedToken = request?.cookies?.['RefreshToken'];

  if (returnedToken) {
    return returnedToken;
  }
  return undefined;
};
