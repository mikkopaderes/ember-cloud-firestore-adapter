import Route from '@ember/routing/route';

export default Route.extend({
  async model() {
    return this.store.findAll('group');
  },
});
