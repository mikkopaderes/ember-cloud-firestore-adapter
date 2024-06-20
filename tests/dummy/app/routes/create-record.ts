import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import Store from '@ember-data/store';

import PostModel from '../models/post';
import GroupModel from '../models/group';
import UserModel from '../models/user';

export default class CreateRecordRoute extends Route {
  @service
  public declare store: Store;

  public async model(): Promise<PostModel> {
    const group = await this.store.findRecord<GroupModel>('group', 'group_a');
    const author = await this.store.findRecord<UserModel>('user', 'user_a');

    return this.store
      .createRecord<PostModel>('post', {
        author,
        group,
        title: 'What does having it all mean to you? (By: Gabe Lewis)',
      })
      .save();
  }
}
