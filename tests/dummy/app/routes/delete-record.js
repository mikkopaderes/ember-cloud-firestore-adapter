import Route from '@ember/routing/route';

export default Route.extend({
  async model() {
    const user = await this.store.createRecord('user', { name: 'To be deleted' }).save();

    await user.destroyRecord();
  },
});
