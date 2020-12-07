declare module 'ember-simple-auth/session-stores/local-storage' {
  export default class LocalStorageStore {
    key: string;

    clear(): Promise<unknown>;

    persist(data: Record<string, unknown>): Promise<void>;

    restore(): Promise<unknown>;
  }
}
