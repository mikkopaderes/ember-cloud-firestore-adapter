// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const FastBoot: { require(moduleName: string): any } | undefined;

declare module '@ember/service' {
  import type { CompatStore } from '@ember-data/legacy-compat';

  interface Registry {
    store: CompatStore;
  }
}
