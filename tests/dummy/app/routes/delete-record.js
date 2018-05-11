import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    return this.get('store').createRecord('user', {
      name: 'To be deleted',
    }).save().then(user => user.destroyRecord());
  },
});
