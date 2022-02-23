/*
  eslint
  import/no-cycle: off,
  @typescript-eslint/ban-ts-comment: off,
  ember/use-ember-data-rfc-395-imports: off,
*/

import DS from 'ember-data';
import { attr, hasMany } from '@ember-data/model';

import { Query } from 'firebase/firestore';

import { limit, query } from 'ember-cloud-firestore-adapter/firebase/firestore';
import OwnerModel from './owner';
import PostModel from './post';
import UserModel from './user';

export default class GroupModel extends OwnerModel {
  @attr('string')
  declare public name: string;

  @hasMany('user')
  declare public members: DS.PromiseManyArray<UserModel>;

  @hasMany('post', {
    // @ts-ignore: TODO - find a way to set custom property in RelationshipOptions interface
    filter(reference: Query) {
      return query(reference, limit(1));
    },
  })
  declare public posts: DS.PromiseManyArray<PostModel>;
}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    'group': GroupModel;
  }
}
