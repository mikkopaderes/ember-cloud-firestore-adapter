import firebase from 'firebase/app';

export default function flattenDocSnapshot(docSnapshot: firebase.firestore.DocumentSnapshot): {
  id: string,
  [key: string]: unknown,
} {
  const { id } = docSnapshot;
  const data = docSnapshot.data() || {};

  return { ...data, id };
}
