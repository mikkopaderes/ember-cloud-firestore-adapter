/*
  eslint
  import/no-cycle: off,
*/

import Model, { attr, hasMany, type AsyncHasMany } from '@ember-data/model';
import type { Type } from '@warp-drive/core-types/symbols';

import type { Query } from 'firebase/firestore';

import { limit, query } from 'ember-cloud-firestore-adapter/firebase/firestore';
import type PostModel from './post';
import type UserModel from './user';

export default class GroupModel extends Model {
  @attr('string')
  declare public name: string;

  @hasMany('user', { async: true, inverse: 'groups' })
  declare public members: AsyncHasMany<UserModel>;

  // @ts-expect-error ember data types won't accept function
  @hasMany('post', {
    async: true,
    inverse: 'group',
    isRealtime: true,

    filter(reference: Query) {
      return query(reference, limit(1));
    },
  })
  declare public posts: AsyncHasMany<PostModel>;

  declare [Type]: 'group';
}
