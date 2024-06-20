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
  public declare title: string;

  @attr('timestamp')
  public declare createdOn: TimestampTransform;

  @belongsTo('user', { async: true, inverse: 'posts' })
  public declare author: DS.PromiseObject<UserModel>;

  @belongsTo('group', { async: true, inverse: 'posts' })
  public declare group: DS.PromiseObject<GroupModel>;

  @belongsTo('user', {
    async: true,
    inverse: null,

    buildReference(db: Firestore) {
      return collection(db, 'publishers');
    },
  })
  public declare publisher: DS.PromiseObject<UserModel>;
}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    post: PostModel;
  }
}
