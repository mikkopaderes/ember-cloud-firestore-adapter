import { action } from '@ember/object';
import Controller from '@ember/controller';

import firebase from 'firebase/app';

export default class QueryController extends Controller {
  @action
  async handleLoadMoreClick(): Promise<void> {
    this.model.set('query.filter', (reference: firebase.firestore.CollectionReference) => {
      reference.orderBy('name').limit(5)
    });

    await this.model.update();
  }
}
