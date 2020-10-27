import Model, { attr, belongsTo } from '@ember-data/model';

export default Model.extend({
  message: attr('string'),
  author: belongsTo('user'),
  post: belongsTo('post'),
});
