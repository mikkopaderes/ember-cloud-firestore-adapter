import { DocumentSnapshot } from 'firebase/firestore';
import firebase from 'firebase/compat/app';

export default function flattenDocSnapshot(
  docSnapshot: firebase.firestore.DocumentSnapshot | DocumentSnapshot,
): {
  id: string,
  [key: string]: unknown,
} {
  const { id } = docSnapshot;
  const data = docSnapshot.data() || {};

  return { ...data, id };
}
