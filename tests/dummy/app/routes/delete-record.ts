import { service } from '@ember/service';
import Route from '@ember/routing/route';
import Store from '@ember-data/store';

export default class DeleteRecordRoute extends Route {
  @service
  public declare store: Store;

  public async beforeModel(): Promise<void> {
    const record = this.store.createRecord('user', { name: 'To be deleted' });

    await record.save();
    await record.destroyRecord();
  }
}
