import Route from '@ember/routing/route';

import UserModel from '../models/user';

export default class DeleteRecordRoute extends Route {
  async model(): Promise<UserModel> {
    return this.store.createRecord('user', { name: 'To be deleted' }).save({
      adapterOptions: {
        isRealtime: true,
      },
    });
  }

  async afterModel(model: UserModel): Promise<void> {
    await model.destroyRecord();
  }
}
