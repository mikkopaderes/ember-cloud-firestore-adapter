import Route from '@ember/routing/route';

export default class FindRecordRoute extends Route {
  async model() {
    return this.store.findRecord('group', 'group_a');
  }
}
