import { Promise } from 'rsvp';
import Route from '@ember/routing/route';

export default Route.extend({
  async model() {
    const users = await this.store.findAll('user');

    const requests = [];

    users.forEach((user) => {
      if (user.get('id') !== 'user_a') {
        const request = user.destroyRecord();

        requests.push(request);
      }
    });

    await Promise.all(requests);
  },
});
