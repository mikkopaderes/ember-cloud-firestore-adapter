import ArrayProxy from '@ember/array/proxy';
import Route from '@ember/routing/route';

import firebase from 'firebase/compat/app';

import GroupModel from '../models/group';

export default class QueryRoute extends Route {
  public async model(): Promise<ArrayProxy<GroupModel>> {
    return this.store.query('group', {
      filter(reference: firebase.firestore.CollectionReference) {
        return reference.orderBy('name').limit(1);
      },
    });
  }
}
