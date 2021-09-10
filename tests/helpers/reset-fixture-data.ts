import firebase from 'firebase/compat/app';

export default async function resetFixtureData(db: firebase.firestore.Firestore): Promise<void> {
  await fetch('http://localhost:8080/emulator/v1/projects/ember-cloud-firestore-adapter-test-project/databases/(default)/documents', {
    method: 'DELETE',
  });

  const batch = db.batch();
  const testData = {
    'admins/user_a': { since: 2010 },
    'admins/user_b': { since: 2015 },
    'users/user_a': { name: 'user_a', age: 15, username: 'user_a' },
    'users/user_a/groups/group_a': { referenceTo: db.doc('groups/group_a') },
    'users/user_a/feeds/post_b': {
      title: 'post_b',
      createdOn: new Date(),
      approvedBy: 'user_a',
      author: db.doc('users/user_b'),
      group: db.doc('groups/group_a'),
    },
    'users/user_a/friends/user_b': { referenceTo: db.doc('users/user_b') },
    'users/user_a/friends/user_c': { referenceTo: db.doc('users/user_c') },
    'users/user_b': { name: 'user_b', age: 10, username: 'user_b' },
    'users/user_b/friends/user_a': { referenceTo: db.doc('users/user_a') },
    'users/user_b/groups/group_a': { referenceTo: db.doc('groups/group_a') },
    'users/user_c': { name: 'user_c', age: 20, username: 'user_c' },
    'users/user_c/friends/user_a': { referenceTo: db.doc('users/user_a') },
    'groups/group_a': { name: 'group_a' },
    'groups/group_a/members/user_a': { referenceTo: db.doc('users/user_a') },
    'groups/group_a/members/user_b': { referenceTo: db.doc('users/user_b') },
    'groups/group_b': { name: 'group_b' },
    'posts/post_a': {
      title: 'post_a',
      createdOn: new Date(),
      approvedBy: 'user_a',
      author: db.doc('users/user_a'),
      group: db.doc('groups/group_a'),
    },
    'posts/post_b': {
      title: 'post_b',
      createdOn: new Date(),
      approvedBy: 'user_a',
      author: db.doc('users/user_b'),
      group: db.doc('groups/group_a'),
    },
    'posts/post_c': {
      title: 'post_c',
      createdOn: new Date(),
      approvedBy: 'user_b',
      author: db.doc('users/user_a'),
      group: db.doc('groups/group_a'),
    },
  };

  const keys = Object.keys(testData) as Array<keyof unknown>;

  keys.forEach((key) => batch.set(db.doc(key), testData[key]));

  await batch.commit();
}
