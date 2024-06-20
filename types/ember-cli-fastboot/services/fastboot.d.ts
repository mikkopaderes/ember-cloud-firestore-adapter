import Service from '@ember/service';

interface RequestObject {
  method: unknown;
  body: unknown;
  cookies: unknown;
  headers: Headers;
  queryParams: unknown;
  path: unknown;
  protocol: unknown;
  host: unknown;
}

export default class FastBoot extends Service {
  isFastBoot: boolean;

  request: RequestObject;
}

declare module '@ember/service' {
  interface Registry {
    fastboot: FastBoot;
  }
}
