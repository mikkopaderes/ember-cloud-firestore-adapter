import { handleRouteResource } from 'ember-cloud-firestore-adapter/utils/mirage-helpers';

/**
 * Mirage configuration
 */
export default function() {
  this.namespace = '/api';

  handleRouteResource(this, 'users');
}
