declare module 'ember-cli-fastboot/services/fastboot' {
  import Service from '@ember/service';

  interface Request {
    method: string;
    body: unknown;
    cookies: unknown;
    headers: Headers;
    queryParams: unknown;
    path: string;
    protocol: string;
    host: string;
  }

  interface Shoebox {
    put(key: string, value: unknown): void;
    retrieve(key: string): undefined | JSON;
  }

  export default class Fastboot extends Service {
    public isFastBoot: boolean;

    public request: Request;

    public shoebox: Shoebox;

    public response: unknown;

    public metadata: unknown;

    public deferRendering(promise: Promise<unknown>): unknown;
  }
}
