import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

import SessionService from 'ember-simple-auth/services/session';
import firebase from 'firebase/compat/app';

export default class LoginRoute extends Route {
  @service
  private session!: SessionService;

  public async beforeModel(): Promise<void> {
    await this.session.authenticate('authenticator:firebase', (auth: firebase.auth.Auth) => (
      auth.createUserWithEmailAndPassword('foo@gmail.com', 'foobar')
    ).then((credential) => credential.user).catch(() => (
      auth.signInWithEmailAndPassword('foo@gmail.com', 'foobar')
    )));
  }
}
