import Service from '@ember/service';
import { inject as service } from '@ember/service';

export default Service.extend({
  firebase: service(),
  instance: null,
  settings: { timestampsInSnapshots: true },

  init(...args) {
    this._super(...args);

    const firestore = this.get('firebase').firestore();

    if (firestore.settings) {
      firestore.settings(this.settings);
    }

    this.set('instance', firestore);
  },
});
