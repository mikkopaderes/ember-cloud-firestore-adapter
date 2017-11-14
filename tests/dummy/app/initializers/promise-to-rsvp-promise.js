import RSVP from 'rsvp';

/**
 * Replaces window.Promise with RSVP.Promise.
 *
 * See: https://github.com/emberjs/rfcs/issues/175
 */
export function initialize() {
  window.Promise = RSVP.Promise;
}

export default {
  initialize,
};
