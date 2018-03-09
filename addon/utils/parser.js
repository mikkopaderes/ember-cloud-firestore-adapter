import { assign } from '@ember/polyfills';
import { camelize } from '@ember/string';
import { pluralize } from 'ember-inflector';

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
 */
export function parseDocSnapshot(type, docSnapshot) {
  const id = docSnapshot.id;
  const data = docSnapshot.data();

  return assign({}, data, { id });
}

/**
 * Builds a collection name from a given name
 *
 * @param {string} name
 * @return {string} URL
 */
export function buildCollectionName(name) {
  return camelize(pluralize(name));
}

/**
 * Builds a path based on a given Cloud Firestore reference
 *
 * @param {Object} ref
 * @return {string} URL
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
   * Builds a Cloud Firestore reference based on a given path
   *
   * @param {firebase.firestore} db
   * @param {string} path
   * @return {Object} Cloud Firestore reference
   * @private
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
