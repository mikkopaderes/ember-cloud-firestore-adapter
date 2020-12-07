declare module 'ember-simple-auth/authenticators/base' {
  export default class BaseAuthenticator {
    authenticate(args: unknown): Promise<unknown>;

    invalidate(data: Record<string, unknown>, args: unknown[]): Promise<void>;

    restore(data: Record<string, unknown>): Promise<unknown>;
  }
}
