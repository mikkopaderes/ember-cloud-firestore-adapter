import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

export default Model.extend({
  title: attr('string'),
  createdOn: attr('timestamp'),
  author: belongsTo('user'),
  comments: hasMany('comment'),
  group: belongsTo('group'),
});
