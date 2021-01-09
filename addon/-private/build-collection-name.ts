import { camelize } from '@ember/string';
import { pluralize } from 'ember-inflector';

export default function buildCollectionName(name: string): string {
  return camelize(pluralize(name));
}
