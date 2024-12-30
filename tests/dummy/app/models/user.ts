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
  public declare name: string;

  @attr('number')
  public declare age: number;

  @hasMany('group', { async: true, inverse: 'members' })
  public declare groups: AsyncHasMany<GroupModel>;

  @hasMany('post', { async: true, inverse: 'author' })
  public declare posts: AsyncHasMany<PostModel>;

  declare [Type]: 'user';
}
