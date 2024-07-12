import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import Store from '@ember-data/store';

import GroupModel from '../models/group';

export default class FindRecordRoute extends Route {
  @service
  public declare store: Store;

  public async model(): Promise<GroupModel> {
    return this.store.findRecord<GroupModel>('group', 'group_a', {
      adapterOptions: {
        isRealtime: true,
      },
    });
  }
}
