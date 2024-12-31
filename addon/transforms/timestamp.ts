import { typeOf } from '@ember/utils';
import Transform from '@ember-data/serializer/transform';

import type { FieldValue } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

import { serverTimestamp } from 'ember-cloud-firestore-adapter/firebase/firestore';

export default class TimestampTransform extends Transform {
  public deserialize(value: Date | Timestamp): Date {
    if (value instanceof Timestamp) {
      return value.toDate();
    }

    return value;
  }

  public serialize(value: unknown): Date | FieldValue {
    return typeOf(value) === 'date' ? (value as Date) : serverTimestamp();
  }
}
