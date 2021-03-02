import { assign } from '@ember/polyfills';
import { camelize } from '@ember/string';
import { pluralize } from 'ember-inflector';

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
 * Parses a document snapshot from Cloud Firestore
 *
 * e.g.
 *
 * For a post model of
 *
 * ```javascript
 * import { belongsTo, hasMany } from 'ember-data/relationships';
 * import Model from 'ember-data/model';
 * import attr from 'ember-data/attr';
 *
 * export default Model.extend({
 *   title: attr('string'),
 *   body: attr('string'),
 *   author: belongsTo('user'),
 *   comments: hasMany('comment'),
 * });
 * ```
 *
 * And a document snapshot that lives in `posts` collection and `post_a`
 * document
 *
 * ```javascript
 * docSnapshot = {
 *   id: 'post_a',
 *
 *   data() {
 *     return {
 *       title: 'Foo',
 *       body: 'Bar',
 *       author: <cloud firestore reference to users/user_a document>
 *     };
 *   }
 * }
 * ```
 *
 * Return would be
 *
 * ```javascript
 * parsed = {
 *   id: 'post_a',
 *   title: 'Foo',
 *   body: 'Bar',
 *   author: <cloud firestore reference to users/user_a document>,
 * }
 * ```
 *
 * @param {DS.Model} type
 * @param {firebase.firestore.DocumentSnapshot} docSnapshot
 * @return {Object} Parsed document snapshot
 * @function
 */
export function parseDocSnapshot(type, docSnapshot, docRef) {
  const { id } = docSnapshot;
  const data = docSnapshot.data();

  data._snapshot = docSnapshot;
  data._docRef = docSnapshot.ref || docRef;
  data._docRefPath = docSnapshot.ref.path || buildPathFromRef(docSnapshot.ref) || docRef.path;

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
