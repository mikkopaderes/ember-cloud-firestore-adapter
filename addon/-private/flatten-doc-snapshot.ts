import type { DocumentSnapshot } from 'firebase/firestore';

export default function flattenDocSnapshot(docSnapshot: DocumentSnapshot): {
  id: string;
  [key: string]: unknown;
} {
  const { id } = docSnapshot;
  const data = docSnapshot.data() || {};

  return { ...data, id };
}
