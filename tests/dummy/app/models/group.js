import Model, { attr, hasMany } from '@ember-data/model';

export default Model.extend({
  name: attr('string'),
  members: hasMany('user'),
  posts: hasMany('post', {
    filter(reference) {
      return reference.limit(1);
    },
  }),
});
