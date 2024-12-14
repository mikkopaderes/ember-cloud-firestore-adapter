/*
  eslint
  import/no-cycle: off,
*/

import Model, { attr, belongsTo, type AsyncBelongsTo } from '@ember-data/model';
import type { Type } from '@warp-drive/core-types/symbols';

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
  public declare author: AsyncBelongsTo<UserModel>;

  @belongsTo('group', { async: true, inverse: 'posts' })
  public declare group: AsyncBelongsTo<GroupModel>;

  // @ts-expect-error ember data types won't accept function
  @belongsTo('user', {
    async: true,
    inverse: null,

    buildReference(db: Firestore) {
      return collection(db, 'publishers');
    },
  })
  public declare publisher: AsyncBelongsTo<UserModel>;

  declare [Type]: 'post';
}
