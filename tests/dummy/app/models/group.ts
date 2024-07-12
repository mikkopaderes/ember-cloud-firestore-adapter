/*
  eslint
  import/no-cycle: off,
*/

import DS from 'ember-data';
import Model, { attr, hasMany } from '@ember-data/model';
import { Type } from '@warp-drive/core-types/symbols';

// import { Query } from 'firebase/firestore';

// import { limit, query } from 'ember-cloud-firestore-adapter/firebase/firestore';
import PostModel from './post';
import UserModel from './user';

export default class GroupModel extends Model {
  @attr('string')
  public declare name: string;

  @hasMany('user', { async: true, inverse: 'groups' })
  public declare members: DS.PromiseManyArray<UserModel>;

  @hasMany('post', {
    async: true,
    inverse: 'group',
    // isRealtime: true,

    // filter(reference: Query) {
    //   return query(reference, limit(1));
    // },
  })
  public declare posts: DS.PromiseManyArray<PostModel>;

  declare [Type]: 'group';
}
