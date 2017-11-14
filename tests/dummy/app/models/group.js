import { hasMany } from 'ember-data/relationships';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  name: attr('string'),
  members: hasMany('user', { async: false }),
  posts: hasMany('post', { async: false }),

  async loadPosts() {
    return await this.get('store').query('post', {
      filter: { group: { eq: this.get('cloudFirestoreReference') } },
    });
  },

  async loadMembers() {
    return this.hasMany('members').reload();
  },
});
