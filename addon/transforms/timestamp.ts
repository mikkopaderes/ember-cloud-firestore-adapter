import { typeOf } from '@ember/utils';
import Transform from '@ember-data/serializer/transform';

import firebase from 'firebase';

export default class TimestampTransform extends Transform {
  deserialize(value: firebase.firestore.Timestamp): Date {
    return value.toDate();
  }

  serialize(value: Date | firebase.firestore.FieldValue): Date | firebase.firestore.FieldValue {
    return typeOf(value) === 'date' ? value : firebase.firestore.FieldValue.serverTimestamp();
  }
}

declare module 'ember-data/types/registries/transform' {
  export default interface TransformRegistry {
    timestamp: TimestampTransform;
  }
}
