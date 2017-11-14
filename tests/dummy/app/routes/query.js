import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    return this.get('store').query('group', {
      sort: 'name',
      page: { limit: 1 },
      queryId: 'foobar',
    });
  },
});
