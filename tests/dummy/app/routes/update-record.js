import Route from '@ember/routing/route';

export default Route.extend({
  model(params) {
    return this.get('store').findRecord('post', 'post_a').then((post) => {
      post.set('title', params.title);

      return post.save().then(() => {
        return post;
      });
    });
  },
});
