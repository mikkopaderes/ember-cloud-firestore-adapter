import { typeOf } from '@ember/utils';
import Transform from 'ember-data/transforms/date';

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
    const date = this._super(serialized);

    return date ? date : serialized;
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
