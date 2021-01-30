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
  public async handleCreateRecordWithIdClick(): Promise<void> {
    const user = await this.store.createRecord('user', {
      id: 'new',
      name: 'new_user_created_with_id',
      age: 25,
    }).save();

    this.users = [user];
  }

  @action
  public async handleCreateRecordWithoutIdClick(): Promise<void> {
    const user = await this.store.createRecord('user', {
      name: 'new_user_created_without_id',
      age: 30,
    }).save();

    this.users = [user];
  }

  @action
  public async handleCreateRecordWithoutBelongsToRelationship(): Promise<void> {
    const user = await this.store.findRecord('user', 'user_a');
    const post = await this.store.createRecord('post', {
      // No belongs to relationship for Group model
      author: user,
      title: 'What does having it all mean to you? (By: Gabe Lewis)',
    }).save();
    const author = await post.get('author');

    this.users = [author];
  }

  @action
  public async handleCreateRecordWithBelongsToBuildReference(): Promise<void> {
    const user = await this.store.findRecord('user', 'user_a');
    const post = await this.store.createRecord('post', {
      id: 'new_post',
      publisher: user,
      title: 'What does having it all mean to you? (By: Gabe Lewis)',
    }).save();
    const publisher = await post.get('publisher');

    this.users = [publisher];
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
