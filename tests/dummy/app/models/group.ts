/*
  eslint
  import/no-cycle: off,
  @typescript-eslint/ban-ts-comment: off,
  ember/use-ember-data-rfc-395-imports: off,
*/

import DS from 'ember-data';
import Model, { attr, hasMany } from '@ember-data/model';

import firebase from 'firebase/app';

import PostModel from './post';
import UserModel from './user';

export default class GroupModel extends Model {
  @attr('string')
  declare public name: string;

  @hasMany('user')
  declare public members: DS.PromiseManyArray<UserModel>;

  @hasMany('post', {
    // @ts-ignore: TODO - find a way to set custom property in RelationshipOptions interface
    filter(reference: firebase.firestore.Query) {
      return reference.limit(1);
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
