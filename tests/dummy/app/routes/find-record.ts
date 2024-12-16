import { service } from '@ember/service';
import Route from '@ember/routing/route';
import type Store from '@ember-data/store';

import type GroupModel from '../models/group';

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
