import Route from '@ember/routing/route';

import UserModel from '../models/user';

export default class DeleteRecordRoute extends Route {
  public async model(): Promise<UserModel> {
    return this.store.createRecord('user', { name: 'To be deleted' }).save({
      adapterOptions: {
        isRealtime: true,
      },
    });
  }

  public async afterModel(model: UserModel): Promise<void> {
    await model.destroyRecord();
  }
}
