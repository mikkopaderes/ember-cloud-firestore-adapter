/* eslint @typescript-eslint/ban-ts-comment: off */

import Model, { attr, belongsTo } from '@ember-data/model';

import firebase from 'firebase/app';

export default class PostModel extends Model.extend({
  title: attr('string'),
  createdOn: attr('timestamp'),
  author: belongsTo('user'),
  group: belongsTo('group'),
  publisher: belongsTo('user', {
    inverse: null,

    // @ts-ignore: TODO - find a way to set custom property in RelationshipOptions interface
    buildReference(db: firebase.firestore.Firestore) {
      return db.collection('publishers');
    },
  }),
}) {}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    'post': PostModel;
  }
}
