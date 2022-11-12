import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

import { Auth } from 'firebase/auth';
import SessionService from 'ember-simple-auth/services/session';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'ember-cloud-firestore-adapter/firebase/auth';

export default class ApplicationController extends Controller {
  @service
  declare public session: SessionService;

  public updateRecordParam: string = Math.random().toString(32).slice(2).substring(0, 5);

  @action
  login(): void {
    this.session.authenticate('authenticator:firebase', (auth: Auth) => (
      createUserWithEmailAndPassword(auth, 'foo@gmail.com', 'foobar')
    ).then((credential) => credential.user).catch(() => (
      signInWithEmailAndPassword(auth, 'foo@gmail.com', 'foobar')
    )));
  }

  @action
  logout(): void {
    this.session.invalidate();
  }
}
