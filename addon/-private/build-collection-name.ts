import { camelize } from '@ember/string';
import { pluralize } from 'ember-inflector';

export default function buildCollectionName(name: string | number): string {
  return camelize(pluralize(name.toString()));
}
