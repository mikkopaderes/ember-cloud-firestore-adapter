import Model, { attr, belongsTo } from '@ember-data/model';

export default class PostModel extends Model.extend({
  title: attr('string'),
  createdOn: attr('timestamp'),
  author: belongsTo('user'),
  group: belongsTo('group'),
}) {}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    'post': PostModel;
  }
}
