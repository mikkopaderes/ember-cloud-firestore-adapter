import Route from '@ember/routing/route';

export default class DeleteRecordRoute extends Route {
  async model() {
    return this.store.createRecord('user', { name: 'To be deleted' }).save({
      adapterOptions: {
        isRealtime: true,
      },
    });
  }

  async afterModel(model) {
    return model.destroyRecord();
  }
}
