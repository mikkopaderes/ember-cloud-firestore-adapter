import Route from '@ember/routing/route';

import GroupModel from '../models/group';

export default class FindRecordRoute extends Route {
  public async model(): Promise<GroupModel> {
    return this.store.findRecord('group', 'group_a');
  }
}
