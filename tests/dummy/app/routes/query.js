import Route from '@ember/routing/route';

export default Route.extend({
  async model() {
    return this.store.query('group', {
      filter(reference) {
        return reference.orderBy('name').limit(1);
      },
    });
  },
});
