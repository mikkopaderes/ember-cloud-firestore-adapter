import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import type Store from '@ember-data/store';
import type ArrayProxy from '@ember/array/proxy';
import type GroupModel from '../models/group';

export default class FindAllRoute extends Route {
  @service declare store: Store;

  public async model(): Promise<ArrayProxy<GroupModel>> {
    return this.store.findAll('group');
  }
}
