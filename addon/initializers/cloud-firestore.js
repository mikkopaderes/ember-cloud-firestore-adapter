import Model from 'ember-data/model';
import attr from 'ember-data/attr';

/**
 * Initializer
 *
 * @param {Application} application
 */
export function initialize(application) {
  reopenModel();
}

export default {
  initialize,
};

/**
 * Reopens the Model class for extension
 */
function reopenModel() {
  Model.reopen({
    cloudFirestoreReference: attr(undefined, { defaultValue: '' }),
  });
}
