import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import Controller from '@ember/controller';
import EmberArray from '@ember/array';

import firebase from 'firebase/app';

import UserModel from '../models/user';

export default class FeaturesController extends Controller {
  @tracked
  public users: UserModel[] | EmberArray<UserModel> = [];

  @action
  public async handleCreateRecordClick(): Promise<void> {
    const user = await this.store.createRecord('user', {
      id: 'new',
      name: 'new_user',
      age: 25,
    }).save();

    this.users = [user];
  }

  @action
  public async handleUpdateRecordClick(): Promise<void> {
    const user = await this.store.findRecord('user', 'user_a');

    user.set('name', 'updated_user');

    await user.save();

    this.users = [user];
  }

  @action
  public async handleDeleteRecordClick(): Promise<void> {
    const users = await this.store.findAll('user');
    const user = users.get('firstObject');

    await user?.destroyRecord();

    this.users = users;
  }

  @action
  public async handleFindAllClick(): Promise<void> {
    const users = await this.store.findAll('user');

    this.users = users;
  }

  @action
  public async handleFindRecordClick(): Promise<void> {
    const user = await this.store.findRecord('user', 'user_a');

    this.users = [user];
  }

  @action
  public async handleQuery1Click(): Promise<void> {
    const users = await this.store.query('user', {
      filter(reference: firebase.firestore.Query) {
        return reference.where('age', '>=', 15);
      },
    });

    this.users = users;
  }

  @action
  public async handleQuery2Click(): Promise<void> {
    const users = await this.store.query('user', {
      buildReference(db: firebase.firestore.Firestore) {
        return db.collection('users').doc('user_a').collection('foobar');
      },
    });

    this.users = users;
  }
}
