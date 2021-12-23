import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

import SessionService from 'ember-simple-auth/services/session';

export default class ApplicationRoute extends Route {
  @service
  private declare session: SessionService;

  public async beforeModel() {
    await this.session.setup();
  }
}
