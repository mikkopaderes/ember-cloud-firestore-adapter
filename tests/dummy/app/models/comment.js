import { belongsTo } from 'ember-data/relationships';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  message: attr('string'),
  author: belongsTo('user'),
  post: belongsTo('post'),
});
