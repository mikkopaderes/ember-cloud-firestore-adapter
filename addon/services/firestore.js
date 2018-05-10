import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Service.extend({
  firebase: service(),
  instance: computed('firebase', function() {
    const firestore = this.get('firebase').firestore();
    if (firestore.settings) {
      const settings = { timestampsInSnapshots: true };
      firestore.settings(settings);
    }
    return firestore;
  }),
});
