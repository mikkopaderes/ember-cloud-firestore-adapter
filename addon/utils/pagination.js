import { set } from '@ember/object';

// eslint-disable-next-line require-jsdoc
export default function updatePaginationOfRelationship(snapshot, relationship, records) {
  const { pagination } = relationship.meta.options;
  if (!pagination) return;
  if (records.length < pagination.size) {
    const model = snapshot.record;
    set(model, `${relationship.meta.key}PaginationAvailable`, false);
    pagination.allLoaded = true;
  }
}

export { updatePaginationOfRelationship };
