import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import type Session from 'ember-simple-auth/services/session';

export default class ApplicationRoute extends Route {
  @service declare session: Session;

  beforeModel() {
    return this.session.setup();
  }
}
