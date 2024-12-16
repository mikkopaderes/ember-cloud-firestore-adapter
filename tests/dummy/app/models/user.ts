/*
  eslint
  import/no-cycle: off,
*/

import DS from 'ember-data';
import Model, { attr, hasMany } from '@ember-data/model';

import type GroupModel from './group';
import type PostModel from './post';

export default class UserModel extends Model {
  @attr('string')
  declare public name: string;

  @hasMany('group', { async: true, inverse: 'members' })
  declare public groups: DS.PromiseManyArray<GroupModel>;

  @hasMany('post', { async: true, inverse: 'author' })
  declare public posts: DS.PromiseManyArray<PostModel>;
}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    user: UserModel;
  }
}
