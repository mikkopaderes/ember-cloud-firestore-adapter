import Model, { attr, hasMany } from '@ember-data/model';

export default Model.extend({
  name: attr('string'),
  groups: hasMany('group'),
  posts: hasMany('post'),
  userBFeeds: hasMany('post', {
    inverse: null,

    buildReference(db, record) {
      return db.collection('users').doc(record.get('id')).collection('feeds');
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
