import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    return this.get('store').query('group', {
      queryId: 'foobar',

      filter(reference) {
        return reference.orderBy('name').limit(1);
      },
    });
  },
});
