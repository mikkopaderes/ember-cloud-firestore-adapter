/* eslint @typescript-eslint/ban-ts-comment: off */

import Model, { attr, hasMany } from '@ember-data/model';

import firebase from 'firebase/app';

export default class GroupModel extends Model.extend({
  name: attr('string'),
  members: hasMany('user'),
  posts: hasMany('post', {
    // @ts-ignore: TODO - find a way to set custom property in RelationshipOptions interface
    filter(reference: firebase.firestore.Query) {
      return reference.limit(1);
    },
  }),
}) {}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    'group': GroupModel;
  }
}
