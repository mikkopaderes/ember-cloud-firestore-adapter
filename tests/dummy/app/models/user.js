import Model, { attr, hasMany } from '@ember-data/model';

export default Model.extend({
  name: attr('string'),
  groups: hasMany('group'),
  posts: hasMany('post'),
  friends: hasMany('user'),
});
