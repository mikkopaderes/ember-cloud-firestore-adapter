// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const FastBoot: { require(moduleName: string): any } | undefined;

import type { CompatStore } from '@ember-data/legacy-compat';

declare module '@ember/service' {
  interface Registry {
    store: CompatStore;
  }
}
