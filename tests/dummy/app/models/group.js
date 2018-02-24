import { hasMany } from 'ember-data/relationships';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  name: attr('string'),
  members: hasMany('user'),
  posts: hasMany('post', {
    filter(reference) {
      return reference.limit(1);
    },
  }),
});
