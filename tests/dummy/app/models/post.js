import { belongsTo, hasMany } from 'ember-data/relationships';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  title: attr('string'),
  createdOn: attr('timestamp'),
  author: belongsTo('user'),
  comment: hasMany('comment'),
  group: belongsTo('group'),
});
