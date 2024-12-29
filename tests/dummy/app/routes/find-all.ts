import { service } from '@ember/service';
import type ArrayProxy from '@ember/array/proxy';
import Route from '@ember/routing/route';
import type Store from '@ember-data/store';

import type GroupModel from '../models/group';

export default class FindAllRoute extends Route {
  @service
  public declare store: Store;

  public async model(): Promise<ArrayProxy<GroupModel>> {
    return this.store.findAll('group');
  }
}
