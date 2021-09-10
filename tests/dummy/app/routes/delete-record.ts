import Route from '@ember/routing/route';

export default class DeleteRecordRoute extends Route {
  public async beforeModel(): Promise<void> {
    const record = this.store.createRecord('user', { name: 'To be deleted' });

    await record.save();
    await record.destroyRecord();
  }
}
