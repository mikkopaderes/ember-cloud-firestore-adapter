import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import {
  query,
  orderBy,
  limit,
} from 'ember-cloud-firestore-adapter/firebase/firestore';

import type Store from '@ember-data/store';
import type firebase from 'firebase/compat/app';
import type ArrayProxy from '@ember/array/proxy';
import type GroupModel from '../models/group';

export default class QueryRoute extends Route {
  @service declare store: Store;

  public async model(): Promise<ArrayProxy<GroupModel>> {
    return this.store.query('group', {
      filter(reference: firebase.firestore.CollectionReference) {
        return query(reference, orderBy('name'), limit(1));
      },
    });
  }
}
