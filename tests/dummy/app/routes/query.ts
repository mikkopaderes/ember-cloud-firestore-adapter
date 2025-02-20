import { service } from '@ember/service';
import type { Collection } from '@ember-data/store/-private/record-arrays/identifier-array';
import Route from '@ember/routing/route';
import type Store from '@ember-data/store';

import type { CollectionReference } from 'firebase/firestore';

import {
  limit,
  query,
  orderBy,
} from 'ember-cloud-firestore-adapter/firebase/firestore';

import type GroupModel from '../models/group';

export default class QueryRoute extends Route {
  @service
  declare public store: Store;

  public async model(): Promise<Collection<GroupModel>> {
    return this.store.query<GroupModel>('group', {
      isRealtime: true,
      // @ts-expect-error ember data types won't accept function
      filter(reference: CollectionReference) {
        return query(reference, orderBy('name'), limit(1));
      },
    });
  }
}
