import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import Controller from '@ember/controller';

export default class FeaturesController extends Controller {
  @tracked
  users = [];

  @action
  async handleCreateRecordClick() {
    const user = await this.store.createRecord('user', {
      id: 'new',
      username: 'new_user',
      age: 25,
    }).save({
      adapterOptions: { onServer: true },
    });

    this.users = [user];
  }

  @action
  async handleUpdateRecordClick() {
    const user = await this.store.findRecord('user', 'user_a');

    user.username = 'updated_user';

    await user.save({
      adapterOptions: { onServer: true },
    });

    this.users = [user];
  }

  @action
  async handleDeleteRecordClick() {
    const users = await this.store.findAll('user');
    const user = users.get('firstObject');

    await user.destroyRecord({
      adapterOptions: { onServer: true },
    });

    this.users = users;
  }

  @action
  async handleFindAllClick() {
    const users = await this.store.findAll('user');

    this.users = users;
  }

  @action
  async handleFindRecordClick() {
    const user = await this.store.findRecord('user', 'user_a');

    this.users = [user];
  }

  @action
  async handleQuery1Click() {
    const users = await this.store.query('user', {
      filter(reference) {
        return reference.where('age', '>=', '15');
      },
    });

    this.users = users;
  }

  @action
  async handleQuery2Click() {
    const users = await this.store.query('user', {
      buildReference(db) {
        return db.collection('users').doc('user_a').collection('foobar');
      },
    });

    this.users = users;
  }
}
