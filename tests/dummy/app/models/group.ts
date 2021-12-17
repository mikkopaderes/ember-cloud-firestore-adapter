/*
  eslint
  @typescript-eslint/ban-ts-comment: off,
*/

import Model, { attr, hasMany, AsyncHasMany } from '@ember-data/model';

import { Query } from 'firebase/firestore';

import { limit, query } from 'ember-cloud-firestore-adapter/firebase/firestore';
import PostModel from './post';
import UserModel from './user';

export default class GroupModel extends Model {
  @attr('string')
  public declare name: string;

  @hasMany('user')
  public declare members: AsyncHasMany<UserModel>;

  @hasMany('post', {
    // @ts-ignore: TODO - find a way to set custom property in RelationshipOptions interface
    filter(reference: Query) {
      return query(reference, limit(1));
    },
  })
  public declare posts: AsyncHasMany<PostModel>;
}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    group: GroupModel;
  }
}
