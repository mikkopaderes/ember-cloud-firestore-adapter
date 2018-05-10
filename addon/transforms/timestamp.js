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
    return serialized.toDate();
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
