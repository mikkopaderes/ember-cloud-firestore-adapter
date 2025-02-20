/*
  eslint
  import/no-cycle: off,
*/

import Model, { attr, belongsTo, type AsyncBelongsTo } from '@ember-data/model';
import type { Type } from '@warp-drive/core-types/symbols';

import type { Firestore } from 'firebase/firestore';

import { collection } from 'ember-cloud-firestore-adapter/firebase/firestore';
import type TimestampTransform from 'ember-cloud-firestore-adapter/transforms/timestamp';
import type GroupModel from './group';
import type UserModel from './user';

export default class PostModel extends Model {
  @attr('string')
  declare public title: string;

  @attr('timestamp')
  declare public createdOn: TimestampTransform;

  @belongsTo('user', { async: true, inverse: 'posts' })
  declare public author: AsyncBelongsTo<UserModel>;

  @belongsTo('group', { async: true, inverse: 'posts' })
  declare public group: AsyncBelongsTo<GroupModel>;

  // @ts-expect-error ember data types won't accept function
  @belongsTo('user', {
    async: true,
    inverse: null,

    buildReference(db: Firestore) {
      return collection(db, 'publishers');
    },
  })
  declare public publisher: AsyncBelongsTo<UserModel>;

  declare [Type]: 'post';
}
