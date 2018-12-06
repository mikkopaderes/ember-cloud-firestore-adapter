import { assign } from '@ember/polyfills';
import { camelize } from '@ember/string';
import { pluralize } from 'ember-inflector';

/**
 * @param {firebase.firestore.DocumentSnapshot} docSnapshot
 * @return {Object} Flattened doc snapshot data
 * @function
 * @private
 */
export function flattenDocSnapshotData(docSnapshot) {
  const { id } = docSnapshot;
  const data = docSnapshot.data();

  return assign({}, data, { id });
}

/**
 * @param {string} name
 * @return {string} URL
 * @function
 */
export function buildCollectionName(name) {
  return camelize(pluralize(name));
}

/**
 * @param {Object} ref
 * @return {string} URL
 * @function
 */
export function buildPathFromRef(ref) {
  let url = '';
  let currentRef = ref;
  let hasParentRef = true;

  while (hasParentRef) {
    url = `${currentRef.id}/${url}`;

    if (!currentRef.parent) {
      hasParentRef = false;
    }

    currentRef = currentRef.parent;
  }

  return url.slice(0, -1);
}

/**
 * @param {firebase.firestore} db
 * @param {string} path
 * @return {Object} Cloud Firestore reference
 * @function
 */
export function buildRefFromPath(db, path) {
  const nodes = path.split('/');
  let ref = db;

  nodes.forEach((node, index) => {
    if (node) {
      if (index % 2 === 0) {
        ref = ref.collection(node);
      } else {
        ref = ref.doc(node);
      }
    }
  });

  return ref;
}
