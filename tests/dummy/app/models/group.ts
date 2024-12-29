/*
  eslint
  import/no-cycle: off,
*/

import type DS from 'ember-data';
import Model, { attr, hasMany } from '@ember-data/model';

import type { Query } from 'firebase/firestore';

import { limit, query } from 'ember-cloud-firestore-adapter/firebase/firestore';
import type PostModel from './post';
import type UserModel from './user';

export default class GroupModel extends Model {
  @attr('string')
  public declare name: string;

  @hasMany('user', { async: true, inverse: 'groups' })
  public declare members: DS.PromiseManyArray<UserModel>;

  @hasMany('post', {
    async: true,
    inverse: 'group',
    isRealtime: true,

    filter(reference: Query) {
      return query(reference, limit(1));
    },
  })
  public declare posts: DS.PromiseManyArray<PostModel>;
}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    group: GroupModel;
  }
}
