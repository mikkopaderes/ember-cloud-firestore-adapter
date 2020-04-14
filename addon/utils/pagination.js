/* eslint-disable require-jsdoc */
import { set } from '@ember/object';

export default function updatePagination(snapshot, relationship, records) {
  const { pagination } = relationship.meta.options;
  if (!pagination) return;
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

export { updatePagination, paginateQuery };
