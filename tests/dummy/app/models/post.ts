/*
  eslint
  @typescript-eslint/ban-ts-comment: off,
*/

import Model, { attr, belongsTo, AsyncBelongsTo } from '@ember-data/model';

import firebase from 'firebase/compat/app';

import { collection } from 'ember-cloud-firestore-adapter/firebase/firestore';
import TimestampTransform from 'ember-cloud-firestore-adapter/transforms/timestamp';
import GroupModel from './group';
import UserModel from './user';

export default class PostModel extends Model {
  @attr('string')
  public declare title: string;

  @attr('timestamp')
  public declare createdOn: TimestampTransform;

  @belongsTo('user')
  public declare author: AsyncBelongsTo<UserModel>;

  @belongsTo('group')
  public declare group: AsyncBelongsTo<GroupModel>;

  @belongsTo('user', {
    inverse: null,

    // @ts-ignore: TODO - find a way to set custom property in RelationshipOptions interface
    buildReference(db: firebase.firestore.Firestore) {
      return collection(db, 'publishers');
    },
  })
  public declare publisher: AsyncBelongsTo<UserModel>;
}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    post: PostModel;
  }
}
