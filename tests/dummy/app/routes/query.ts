import { service } from '@ember/service';
import type ArrayProxy from '@ember/array/proxy';
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
  public declare store: Store;

  public async model(): Promise<ArrayProxy<GroupModel>> {
    return this.store.query('group', {
      isRealtime: true,
      filter(reference: CollectionReference) {
        return query(reference, orderBy('name'), limit(1));
      },
    });
  }
}
