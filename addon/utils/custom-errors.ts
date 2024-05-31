export default class AdapterRecordNotFoundError extends Error {
  public cause: string | undefined;

  constructor(message?: string, options?: { cause: string }) {
    super(message);

    this.name = this.constructor.name;

    if (options !== undefined) {
      this.cause = options.cause;
    }
  }
}
