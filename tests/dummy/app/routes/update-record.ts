import { service } from '@ember/service';
import Route from '@ember/routing/route';
import Store from '@ember-data/store';

import PostModel from '../models/post';

export default class UpdateRecordRoute extends Route {
  @service
  public declare store: Store;

  public async model(params: { title: string }): Promise<PostModel> {
    const post = await this.store.findRecord('post', 'post_a');

    post.set('title', params.title);
    await post.save();

    return post;
  }
}
