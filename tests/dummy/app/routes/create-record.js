import Route from '@ember/routing/route';

export default class CreateRecordRoute extends Route {
  async model() {
    const group = await this.store.findRecord('group', 'group_a');
    const author = await this.store.findRecord('user', 'user_a');

    return this.store.createRecord('post', {
      author,
      group,
      title: 'What does having it all mean to you? (By: Gabe Lewis)',
    }).save();
  }
}
