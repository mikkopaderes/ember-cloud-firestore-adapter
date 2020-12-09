import { typeOf } from '@ember/utils';
import Transform from '@ember-data/serializer/transform';

import firebase from 'firebase';

export default class TimestampTransform extends Transform {
  public deserialize(value: firebase.firestore.Timestamp): Date {
    if (value.toDate) {
      return value.toDate();
    }
    return value;
  }

  public serialize(
    value: Date | firebase.firestore.FieldValue,
  ): Date | firebase.firestore.FieldValue {
    if (typeOf(value) !== 'date' && value !== null) {
      return firebase.firestore.FieldValue.serverTimestamp();
    }
    return value;
  }
}

declare module 'ember-data/types/registries/transform' {
  export default interface TransformRegistry {
    timestamp: TimestampTransform;
  }
}
