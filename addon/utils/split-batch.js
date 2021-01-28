/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
/* eslint-disable require-jsdoc */
/* eslint-disable ember/use-ember-get-and-set */

export default function splitBatch(db, MAX_BATCH_SIZE = 500) {
  let internalBatch = { mutations: 0, batch: db.batch() };

  const batches = {
    queue: [internalBatch],

    commit() {
      const { queue } = this;
      if (!queue.length) return null;
      if (queue.length === 1) return queue[0].batch.commit();
      return Promise.all(queue.map(({ batch }) => batch.commit()));
    },

    push(b) {
      this.queue.push(b);
    },
  };

  function handleBadgeOverflow() {
    if (internalBatch.mutations < MAX_BATCH_SIZE) {
      internalBatch.mutations += 1;
      return;
    }

    internalBatch = { mutations: 1, batch: db.batch() };
    batches.push(internalBatch);
  }

  function _set(...args) {
    handleBadgeOverflow();
    internalBatch.batch.set(...args);
  }

  function _update(...args) {
    handleBadgeOverflow();
    internalBatch.batch.update(...args);
  }

  function _write(...args) {
    handleBadgeOverflow();
    internalBatch.batch.write(...args);
  }

  function _delete(...args) {
    handleBadgeOverflow();
    internalBatch.batch.delete(...args);
  }

  return {
    commit: batches.commit.bind(batches),
    getTotalMutationsCount: () =>
      batches.queue.reduce((total, { mutations }) => (total += mutations), 0),
    getCount: () => batches.queue.length,
    delete: _delete,
    update: _update,
    write: _write,
    set: _set,
  };
}
