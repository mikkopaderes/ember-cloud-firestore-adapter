import Route from '@ember/routing/route';

export default Route.extend({
  async model() {
    return this.store.createRecord('user', { name: 'To be deleted' }).save({
      adapterOptions: {
        isRealtime: true,
      },
    });
  },

  async afterModel(model) {
    return model.destroyRecord();
  },
});
