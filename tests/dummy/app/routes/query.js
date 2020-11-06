import Route from '@ember/routing/route';

export default class QueryRoute extends Route {
  async model() {
    return this.store.query('group', {
      filter(reference) {
        return reference.orderBy('name').limit(1);
      },
    });
  }
}
