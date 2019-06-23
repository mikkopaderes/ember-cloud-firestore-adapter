/**
 * Initializes Firebase in FastBoot environment
 */
export function initialize() {
  FastBoot.require('firebase/auth');
  FastBoot.require('firebase/firestore');
}

export default {
  initialize,
};
