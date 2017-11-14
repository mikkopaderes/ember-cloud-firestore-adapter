import { Promise } from 'rsvp';
import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    return this.get('store').findAll('user').then((users) => {
      const requests = [];

      users.forEach((user) => {
        if (user.get('id') !== 'user_a') {
          const request = user.destroyRecord();

          requests.push(request);
        }
      });

      return Promise.all(requests);
    });
  },
});
