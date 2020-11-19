import { typeOf } from '@ember/utils';
import Transform from '@ember-data/serializer/transform';

import firebase from 'firebase';

export default class Timestamp extends Transform {
  deserialize(serialized) {
    if (typeOf(serialized) === 'object' && serialized.toDate) {
      return serialized.toDate();
    }

    return serialized;
  }

  serialize(deserialized) {
    if (typeOf(deserialized) !== 'date' && typeOf(deserialized) !== 'null') {
      return firebase.firestore.FieldValue.serverTimestamp();
    }

    return deserialized;
  }
}
