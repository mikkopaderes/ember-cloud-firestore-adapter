/* eslint-disable require-jsdoc */
import { getProperties, set } from '@ember/object';
import { merge } from '@ember/polyfills';

function isPaginated(relationship) {
  const { pagination } = relationship.meta.options;
  return !!pagination;
}

export default function updatePaginationMeta(snapshot, relationship, records) {
  if (!isPaginated(relationship)) return;
  const { pagination } = relationship.meta.options;
  const model = snapshot.record;
  const allLoaded = records.length < pagination.size;
  if (allLoaded) pagination.allLoaded = allLoaded;
  pagination.page = pagination.page && ++pagination.page || 1;
  set(model, `${relationship.meta.key}PaginationAvailable`, !allLoaded);
}

function paginateQuery(reference, paginationOptions, adapterOptions) {
  const { size, orderBy, page } = paginationOptions;
  const { lastSnapshot } = adapterOptions;
  let ref = reference;
  if (orderBy) ref = ref.orderBy(...orderBy.split(':'));
  if (page && lastSnapshot) ref = ref.startAfter(lastSnapshot);
  return ref.limit(size);
}

function mergePaginatedRecords(loadedRecords, model, relationship) {
  return model.get(relationship.key).reduce((prev, record) => {
    const hasRecord = prev.findBy('data.id', record.id);
    if (hasRecord) return prev;
    prev.push({
      data: { type: relationship.type, id: record.id },
    });
    return prev;
  }, loadedRecords);
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
