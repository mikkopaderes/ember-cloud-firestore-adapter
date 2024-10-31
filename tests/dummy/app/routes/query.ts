import { service } from '@ember/service';
import { Collection } from '@ember-data/store/-private/record-arrays/identifier-array';
import Route from '@ember/routing/route';
import Store from '@ember-data/store';

import { CollectionReference } from 'firebase/firestore';

import {
  limit,
  query,
  orderBy,
} from 'ember-cloud-firestore-adapter/firebase/firestore';

import GroupModel from '../models/group';

export default class QueryRoute extends Route {
  @service
  public declare store: Store;

  public async model(): Promise<Collection<GroupModel>> {
    return this.store.query<GroupModel>('group', {
      isRealtime: true,
      filter(reference: CollectionReference) {
        return query(reference, orderBy('name'), limit(1));
      },
    });
  }
}
