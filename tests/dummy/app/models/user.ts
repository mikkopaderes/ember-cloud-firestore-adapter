/*
  eslint
  import/no-cycle: off,
*/

import DS from 'ember-data';
import Model, { attr, hasMany } from '@ember-data/model';
import { Type } from '@warp-drive/core-types/symbols';

import GroupModel from './group';
import PostModel from './post';

export default class UserModel extends Model {
  @attr('string')
  public declare name: string;

  @attr('number')
  public declare age: number;

  @hasMany('group', { async: true, inverse: 'members' })
  public declare groups: DS.PromiseManyArray<GroupModel>;

  @hasMany('post', { async: true, inverse: 'author' })
  public declare posts: DS.PromiseManyArray<PostModel>;

  declare [Type]: 'user';
}
