import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  session: service('session'),

  beforeModel() {
    return this.session.authenticate('authenticator:firebase', auth => (
      auth.signInWithEmailAndPassword('foo@gmail.com', 'foobar')
    ));
  },
});
