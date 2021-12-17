import { action } from '@ember/object';
import Controller from '@ember/controller';
import {
  query,
  orderBy,
  limit,
} from 'ember-cloud-firestore-adapter/firebase/firestore';

import type firebase from 'firebase/compat/app';

export default class QueryController extends Controller {
  @action
  public async handleLoadMoreClick(): Promise<void> {
    this.model.set(
      'query.filter',
      (reference: firebase.firestore.CollectionReference) => {
        return query(reference, orderBy('name'), limit(5));
      }
    );

    await this.model.update();
  }
}
