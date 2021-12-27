import { action } from '@ember/object';
import Controller from '@ember/controller';

import {
  query,
  orderBy,
  limit,
} from 'ember-cloud-firestore-adapter/firebase/firestore';
import { CollectionReference } from 'firebase/firestore';

export default class QueryController extends Controller {
  @action
  public async handleLoadMoreClick(): Promise<void> {
    this.model.set(
      'query.filter',
      (reference: CollectionReference) => query(reference, orderBy('name'), limit(5)),
    );

    await this.model.update();
  }
}
