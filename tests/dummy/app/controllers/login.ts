import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

import SessionService from 'ember-simple-auth/services/session';

export default class LoginController extends Controller {
  @service
  public session!: SessionService;
}
