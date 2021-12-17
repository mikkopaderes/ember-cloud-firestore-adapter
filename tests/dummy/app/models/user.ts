import Model, { attr, hasMany, AsyncHasMany } from '@ember-data/model';

import type GroupModel from './group';
import type PostModel from './post';

export default class UserModel extends Model {
  @attr('string')
  public declare name: string;

  @hasMany('group')
  public declare groups: AsyncHasMany<GroupModel>;

  @hasMany('post')
  public declare posts: AsyncHasMany<PostModel>;

  @hasMany('user', { inverse: null })
  public declare users: AsyncHasMany<this>;
}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    user: UserModel;
  }
}
