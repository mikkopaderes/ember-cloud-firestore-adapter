import MockFirebase from 'mock-cloud-firestore';
import Service from '@ember/service';

/**
 * Mocks Cloud Firestore
 *
 * @param {Object} context
 * @param {Object} fixtureData
 * @return {Ember.Service} Firebase service
 */
export default function mockCloudFirestore(context, fixtureData) {
  const mockFirebase = new MockFirebase();
  const mockFirebasePojo = {
    _data: fixtureData,
    initializeApp: mockFirebase.initializeApp,
    firestore: mockFirebase.firestore,
  };
  const firebaseService = Service.extend(mockFirebasePojo);

  context.owner.register(`service:firebase`, firebaseService);

  return context.owner.lookup('service:firebase', { as: 'firebase' });
}
