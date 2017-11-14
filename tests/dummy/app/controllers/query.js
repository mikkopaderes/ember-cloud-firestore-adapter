import Controller from '@ember/controller';

export default Controller.extend({
  loadMore() {
    const model = this.get('model');

    model.set('query.page.limit', model.get('query.page.limit') + 5);

    model.update();
  },
});
