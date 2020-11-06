import Route from '@ember/routing/route';

export default class FindAllRoute extends Route {
  async model() {
    return this.store.findAll('group');
  }
}
