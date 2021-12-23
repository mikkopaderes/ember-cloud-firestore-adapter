import { inject as service } from '@ember/service';
import ArrayProxy from '@ember/array/proxy';
import Route from '@ember/routing/route';
import Store from '@ember-data/store';

import GroupModel from '../models/group';

export default class FindAllRoute extends Route {
  @service
  public declare store: Store;

  public async model(): Promise<ArrayProxy<GroupModel>> {
    return this.store.findAll('group');
  }
}
