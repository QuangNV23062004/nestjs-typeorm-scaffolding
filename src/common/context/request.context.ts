import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  method: string;
  url: string;
  ip?: string;
  userAgent?: string;
  accountId?: string; // filled in later by the guard
  startedAt: number;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export const getRequestContext = (): RequestContext | undefined =>
  requestContextStorage.getStore();
