import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import Store from '@ember-data/store';
import { query as _query } from '@ember-data/json-api/request';

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

  public async model(): Promise<GroupModel[]> {
    const groups = await this.store.request(
      _query<GroupModel>('group', {
        isRealtime: true,
        filter(reference: CollectionReference) {
          return query(reference, orderBy('name'), limit(1));
        },
      }),
    );
    return groups.content.data;
  }
}
