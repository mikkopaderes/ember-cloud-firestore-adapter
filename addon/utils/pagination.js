import { set } from '@ember/object';

// eslint-disable-next-line require-jsdoc
export default function updatePaginationOfRelationship(snapshot, relationship, records) {
  const { pagination } = relationship.meta.options;
  if (!pagination) return;
  // const existingRecords = snapshot.hasMany(relationship.key);
  // if (existingRecords) records.existing = existingRecords;
  const model = snapshot.record;
  const allLoaded = records.length < pagination.size;
  if (allLoaded) pagination.allLoaded = allLoaded;
  set(model, `${relationship.meta.key}PaginationAvailable`, !allLoaded);
}

export { updatePaginationOfRelationship };
