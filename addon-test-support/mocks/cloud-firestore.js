import MockFirebase from 'mock-cloud-firestore';
import Service from '@ember/service';

/**
 * Mocks Cloud Firestore
 *
 * @param {Object} owner
 * @param {Object} fixtureData
 * @return {Ember.Service} Firebase service
 */
export default function mockCloudFirestore(owner, fixtureData) {
  const mockFirebase = new MockFirebase();
  const mockFirebasePojo = {
    _data: fixtureData,
    initializeApp: mockFirebase.initializeApp,
    firestore: mockFirebase.firestore,
  };
  const firebaseService = Service.extend(mockFirebasePojo);

  owner.register('service:firebase', firebaseService);

  return owner.lookup('service:firebase', { as: 'firebase' });
}
