import { action } from '@ember/object';
import Controller from '@ember/controller';

export default class QueryController extends Controller {
  @action
  handleLoadMoreClick() {
    this.model.set('query.filter', (reference) => reference.orderBy('name').limit(5));

    this.model.update();
  }
}
