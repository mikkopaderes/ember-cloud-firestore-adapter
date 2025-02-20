/*
  eslint
  import/no-cycle: off,
*/

import Model, { attr, hasMany, type AsyncHasMany } from '@ember-data/model';
import type { Type } from '@warp-drive/core-types/symbols';

import type GroupModel from './group';
import type PostModel from './post';

export default class UserModel extends Model {
  @attr('string')
  declare public name: string;

  @attr('number')
  declare public age: number;

  @attr('string')
  declare public username: string;

  @hasMany('group', { async: true, inverse: 'members' })
  declare public groups: AsyncHasMany<GroupModel>;

  @hasMany('post', { async: true, inverse: 'author' })
  declare public posts: AsyncHasMany<PostModel>;

  declare [Type]: 'user';
}
