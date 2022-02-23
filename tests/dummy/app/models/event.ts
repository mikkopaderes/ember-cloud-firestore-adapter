/*
  eslint
  import/no-cycle: off,
  ember/use-ember-data-rfc-395-imports: off,
*/

import DS from 'ember-data';
import Model, { attr, belongsTo } from '@ember-data/model';

import OwnerModel from './owner';

export default class EventModel extends Model {
  @attr('string')
  declare public body: string;

  @belongsTo('owner', { polymorphic: true })
  declare public owner: DS.PromiseObject<OwnerModel>;
}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    'event': EventModel;
  }
}
