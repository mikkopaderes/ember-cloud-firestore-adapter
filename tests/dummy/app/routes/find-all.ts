import ArrayProxy from '@ember/array/proxy';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import type Store from '@ember-data/store';
import GroupModel from '../models/group';

export default class FindAllRoute extends Route {
  @service
  declare store: Store;

  public async model(): Promise<ArrayProxy<GroupModel>> {
    return this.store.findAll('group');
  }
}
