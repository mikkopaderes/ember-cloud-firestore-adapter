import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

import SessionService from 'ember-simple-auth/services/session';

export default class LogoutRoute extends Route {
  @service
  private session!: SessionService;

  public async beforeModel(): Promise<void> {
    await this.session.invalidate();
  }
}
