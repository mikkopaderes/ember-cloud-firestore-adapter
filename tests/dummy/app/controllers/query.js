import Controller from '@ember/controller';

export default Controller.extend({
  loadMore() {
    this.model.set('query.filter', reference => reference.orderBy('name').limit(5));

    this.model.update();
  },
});
