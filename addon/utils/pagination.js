/* eslint-disable require-jsdoc */
import { getProperties } from '@ember/object';
import { merge } from '@ember/polyfills';

function isPaginated(relationship) {
  const { pagination } = relationship.meta.options;
  return !!pagination;
}

function _updateAllLoaded(records, relationship) {
  const { pagination } = relationship.meta.options;
  const allLoaded = records.length >= 0 && records.length < pagination.size;
  pagination.allLoaded = allLoaded;
}

export default function updatePaginationMeta(relationship, records) {
  if (!isPaginated(relationship)) return;
  const { pagination } = relationship.meta.options;
  _updateAllLoaded(records, relationship);
  pagination.page = pagination.page && ++pagination.page || 1;
}

function paginateQuery(reference, paginationOptions, adapterOptions) {
  const { size, orderBy, page } = paginationOptions;
  const { lastSnapshot } = adapterOptions;
  let ref = reference;
  if (orderBy) ref = ref.orderBy(...orderBy.split(':'));
  if (page && lastSnapshot) ref = ref.startAfter(lastSnapshot);
  return ref.limit(size);
}

function recordsAreTheSame(existingRecords, loadedRecords) {
 const loadedRecordIds = loadedRecords.mapBy('data.id');
  const newIds = existingRecords
    .mapBy('id')
    .filter(id => !loadedRecordIds.includes(id));

  return newIds.length === 0;
}

function mergePaginatedRecords(loadedRecords, model, relationship) {
  const existingRecords = model.get(relationship.key);
  const triggeredByInverseRelationship = recordsAreTheSame(existingRecords, loadedRecords);

  const shouldUpdateAllLoaded =
    loadedRecords.length !== existingRecords.length ||
    triggeredByInverseRelationship;

  if (shouldUpdateAllLoaded) _updateAllLoaded(loadedRecords, relationship);

  const updatedRecords = existingRecords.reduce((prev, record) => {
    const hasRecord = prev.findBy('data.id', record.id);
    if (hasRecord) return prev;
    prev.push({
      data: { type: relationship.type, id: record.id },
    });
    return prev;
  }, loadedRecords);

  return updatedRecords;
}

function addPaginatedPayload(snapshot, relationship, records) {
  if (!isPaginated(relationship)) return records;
  const existingRecords = snapshot.hasMany(relationship.key);
  if (!existingRecords) return records;
  const serializedRecords = existingRecords.reduce((prev, _snapshot) => {
    const hasRecord = records.findBy('data.id', _snapshot.id);
    if (hasRecord) return prev;
    let serializedSnapshot = _snapshot.serialize({ includeId: true });
    const _fsProperties = getProperties(_snapshot.record, '_snapshot', '_docRef', '_docRefPath', '_collectionRefPath');
    serializedSnapshot = merge(serializedSnapshot, _fsProperties);
    prev.push(serializedSnapshot);
    return prev;
  }, []);
  return records.unshift(...serializedRecords);
}

export { updatePaginationMeta, paginateQuery, mergePaginatedRecords, addPaginatedPayload };
