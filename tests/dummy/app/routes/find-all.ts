import { service } from '@ember/service';
import Route from '@ember/routing/route';
import type Store from '@ember-data/store';

import type GroupModel from '../models/group';

export default class FindAllRoute extends Route {
  @service
  public declare store: Store;

  public async model(): Promise<GroupModel[]> {
    return this.store.findAll<GroupModel>('group');
  }
}
