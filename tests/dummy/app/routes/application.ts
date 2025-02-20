import { service } from '@ember/service';
import Route from '@ember/routing/route';

import type SessionService from 'ember-simple-auth/services/session';

export default class ApplicationRoute extends Route {
  @service
  declare private session: SessionService;

  public async beforeModel(): Promise<void> {
    await this.session.setup();
  }
}
