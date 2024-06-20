import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import Store from '@ember-data/store';

import type UserModel from '../models/user';

export default class DeleteRecordRoute extends Route {
  @service
  public declare store: Store;

  public async beforeModel(): Promise<void> {
    const record = this.store.createRecord<UserModel>('user', {
      name: 'To be deleted',
    });

    await record.save();
    await record.destroyRecord();
  }
}
