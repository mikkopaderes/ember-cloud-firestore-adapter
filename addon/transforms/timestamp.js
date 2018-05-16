import { typeOf } from '@ember/utils';
import Transform from 'ember-data/transform';

import firebase from 'firebase';

/**
 * @class Timestamp
 * @namespace Transform
 * @extends DS.Transform
 */
export default Transform.extend({
  /**
   * @override
   */
  deserialize(serialized) {
    if (typeOf(serialized) === 'object' && serialized.toDate) {
      return serialized.toDate();
    }

    return serialized;
  },

  /**
   * @override
   */
  serialize(deserialized) {
    if (typeOf(deserialized) !== 'date') {
      return firebase.firestore.FieldValue.serverTimestamp();
    }

    return deserialized;
  },
});
