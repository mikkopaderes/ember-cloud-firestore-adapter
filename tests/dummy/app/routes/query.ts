import { inject as service } from '@ember/service';
import ArrayProxy from '@ember/array/proxy';
import Route from '@ember/routing/route';
import Store from '@ember-data/store';

import firebase from 'firebase/compat/app';

import GroupModel from '../models/group';

export default class QueryRoute extends Route {
  @service
  public declare store: Store;

  public async model(): Promise<ArrayProxy<GroupModel>> {
    return this.store.query('group', {
      filter(reference: firebase.firestore.CollectionReference) {
        return reference.orderBy('name').limit(1);
      },
    });
  }
}
