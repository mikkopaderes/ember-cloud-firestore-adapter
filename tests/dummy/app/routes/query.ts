import { inject as service } from '@ember/service';
import ArrayProxy from '@ember/array/proxy';
import Route from '@ember/routing/route';
import Store from '@ember-data/store';
import {
  query,
  orderBy,
  limit,
} from 'ember-cloud-firestore-adapter/firebase/firestore';

import type firebase from 'firebase/compat/app';
import type GroupModel from '../models/group';

export default class QueryRoute extends Route {
  @service
  public declare store: Store;

  public async model(): Promise<ArrayProxy<GroupModel>> {
    return this.store.query('group', {
      filter(reference: firebase.firestore.CollectionReference) {
        return query(reference, orderBy('name'), limit(1));
      },
    });
  }
}
