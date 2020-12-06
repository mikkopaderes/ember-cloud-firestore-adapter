import Model, { attr, hasMany } from '@ember-data/model';

export default class UserModel extends Model.extend({
  name: attr('string'),
  groups: hasMany('group'),
  posts: hasMany('post'),
  friends: hasMany('user'),
}) { }

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    'user': UserModel;
  }
}
