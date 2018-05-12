import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    return this.get('store').findRecord('group', 'group_a').then(group => this.get('store').findRecord('user', 'user_a').then(author => this.get('store').createRecord('post', {
      author,
      group,
      title: 'What does having it all mean to you? (By: Gabe Lewis)',
    }).save()));
  },
});
