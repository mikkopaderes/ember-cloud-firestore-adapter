import Model, { attr, belongsTo } from '@ember-data/model';

export default Model.extend({
  title: attr('string'),
  createdOn: attr('timestamp'),
  author: belongsTo('user'),
  group: belongsTo('group'),
});
