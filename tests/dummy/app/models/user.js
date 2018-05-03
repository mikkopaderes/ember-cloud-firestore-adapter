import { hasMany } from 'ember-data/relationships';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  name: attr('string'),
  groups: hasMany('group'),
  posts: hasMany('post'),
  userBPosts: hasMany('post', {
    inverse: null,

    buildReference(db) {
      return db.collection('posts');
    },

    filter(reference) {
      const db = reference.firestore;

      return reference.where(
        'author',
        '==',
        db.collection('users').doc('user_b'),
      );
    },
  }),
});
