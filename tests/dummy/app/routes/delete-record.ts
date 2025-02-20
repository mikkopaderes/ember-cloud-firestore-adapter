import { service } from '@ember/service';
import Route from '@ember/routing/route';
import type Store from '@ember-data/store';

import type UserModel from '../models/user';

export default class DeleteRecordRoute extends Route {
  @service
  declare public store: Store;

  public async beforeModel(): Promise<void> {
    const record = this.store.createRecord<UserModel>('user', {
      name: 'To be deleted',
    });

    await record.save();
    await record.destroyRecord();
  }
}
