import Route from '@ember/routing/route';

export default Route.extend({
  async model(params) {
    const post = await this.store.findRecord('post', 'post_a');

    post.set('title', params.title);
    await post.save();

    return post;
  },
});
