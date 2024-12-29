import { action } from '@ember/object';
import Controller from '@ember/controller';

import type { CollectionReference } from 'firebase/firestore';

import {
  query,
  orderBy,
  limit,
} from 'ember-cloud-firestore-adapter/firebase/firestore';

export default class QueryController extends Controller {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  declare model: any;

  @action
  public async handleLoadMoreClick(): Promise<void> {
    this.model.set('query.filter', (reference: CollectionReference) =>
      query(reference, orderBy('name'), limit(5)),
    );

    await this.model.update();
  }
}
