/*
  eslint
  import/no-cycle: off,
*/

import DS from 'ember-data';
import Model, { attr, belongsTo } from '@ember-data/model';

import { Firestore } from 'firebase/firestore';

import { collection } from 'ember-cloud-firestore-adapter/firebase/firestore';
import TimestampTransform from 'ember-cloud-firestore-adapter/transforms/timestamp';
import GroupModel from './group';
import UserModel from './user';

export default class PostModel extends Model {
  @attr('string')
  declare public title: string;

  @attr('timestamp')
  declare public createdOn: TimestampTransform;

  @belongsTo('user', { async: true, inverse: 'posts' })
  declare public author: DS.PromiseObject<UserModel>;

  @belongsTo('group', { async: true, inverse: 'posts' })
  declare public group: DS.PromiseObject<GroupModel>;

  // @ts-ignore: TODO - find a way to set custom property in RelationshipOptions interface
  @belongsTo('user', {
    async: true,
    inverse: null,

    buildReference(db: Firestore) {
      return collection(db, 'publishers');
    },
  })
  declare public publisher: DS.PromiseObject<UserModel>;
}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    'post': PostModel;
  }
}
