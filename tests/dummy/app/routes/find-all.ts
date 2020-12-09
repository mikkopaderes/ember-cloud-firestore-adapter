import ArrayProxy from '@ember/array/proxy';
import Route from '@ember/routing/route';

import GroupModel from '../models/group';

export default class FindAllRoute extends Route {
  public async model(): Promise<ArrayProxy<GroupModel>> {
    return this.store.findAll('group');
  }
}
