/**
 * Handles a resource for a route
 *
 * @param {MirageServerConfig} context
 * @param {string} collection
 * @param {string} [urlPrefix]
 */
export function handleRouteResource(context, collection, urlPrefix) {
  const listUrl = urlPrefix ? urlPrefix : `/${collection}`;
  const detailUrl = `${listUrl}/:id`;

  context.get(listUrl, getRecordHandler(collection));
  context.get(detailUrl);
  context.post(listUrl);
  context.put(detailUrl);
  context.patch(detailUrl);
  context.del(detailUrl);
}

/**
 * Handles Mirage's GET requests
 *
 * @param {string} collection
 * @return {function} Handler
 */
function getRecordHandler(collection) {
  return (schema, request) => {
    const payload = schema[collection].all();
    const path = request.queryParams.path;
    let models = path
      ? getRecordsFromPath(schema, collection, path)
      : payload.models;

    models = filterModels(models, request.queryParams);
    models = sortModels(models, request.queryParams.sort, true);
    models = paginateModels(models, request.queryParams);
    models = sortModels(models, request.queryParams.sort, false);

    payload.models = models;

    return payload;
  };
}

/**
 * Fetches record from the specified path
 *
 * @param {Object} schema
 * @param {string} collection
 * @param {string} path
 * @return {Object} Record
 */
function getRecordsFromPath(schema, collection, path) {
  const [pathCollection, pathId, pathField] = path.split('/');
  const model = schema[pathCollection].find(pathId);
  const models = [];

  model[pathField].forEach((id) => {
    models.push(schema[collection].find(id));
  });

  return models;
}

/**
 * Filters models
 *
 * @param {Array} models
 * @param {Object} queryParams
 * @return {Array} Filtered models
 */
function filterModels(models, queryParams) {
  let filteredModels = models;

  for (const queryParam in queryParams) {
    if (Object.prototype.hasOwnProperty.call(queryParams, queryParam)) {
      if (queryParam.startsWith('filter')) {
        const [attribute, operator] = getParamAttributes(queryParam);
        const value = queryParams[queryParam];

        filteredModels = filteredModels.filter((model) => {
          const modelAttributeValue = model['attrs'][attribute];
          let isFilterMatched = false;

          if (operator == 'lt') {
            isFilterMatched = modelAttributeValue < value;
          } else if (operator == 'lte') {
            isFilterMatched = modelAttributeValue <= value;
          } else if (operator == 'eq') {
            isFilterMatched = modelAttributeValue === value;
          } else if (operator == 'gt') {
            isFilterMatched = modelAttributeValue > value;
          } else if (operator == 'gte') {
            isFilterMatched = modelAttributeValue >= value;
          }

          return isFilterMatched;
        });
      }
    }
  }

  return filteredModels;
}

/**
 * Sorts models
 *
 * @param {Array} models
 * @param {string} sort
 * @param {boolean} isForcingAscending
 * @return {Array} Sorted models
 */
function sortModels(models, sort, isForcingAscending) {
  let sortedModels = models;

  if (sort) {
    const sortings = sort.split(',');

    sortings.forEach((sorting) => {
      if (sorting.startsWith('-') && !isForcingAscending) {
        sortedModels = sortedModels.slice().sort((a, b) => {
          const attribute = sorting.substring(1);

          if (typeof a['attrs'][attribute] === 'number') {
            return b['attrs'][attribute] - a['attrs'][attribute];
          } else {
            if (a['attrs'][attribute] > b['attrs'][attribute]) {
              return -1;
            } else if (a['attrs'][attribute] < b['attrs'][attribute]) {
              return 1;
            } else {
              return 0;
            }
          }
        });
      } else {
        sortedModels = sortedModels.slice().sort((a, b) => {
          if (typeof a['attrs'][sorting] === 'number') {
            return a['attrs'][sorting] - b['attrs'][sorting];
          } else {
            if (a['attrs'][sorting] < b['attrs'][sorting]) {
              return -1;
            } else if (a['attrs'][sorting] > b['attrs'][sorting]) {
              return 1;
            } else {
              return 0;
            }
          }
        });
      }
    });
  }

  return sortedModels;
}

/**
 * Paginates records
 *
 * @param {Array} models
 * @param {Object} queryParams
 * @return {Array} Paginated models
 */
function paginateModels(models, queryParams) {
  if (!isNumOfCursorValid(queryParams)) {
    throw new Error('Number of cursors doesn\'t match the number of sorting attributes');
  }

  let paginatedModels = models;

  for (const queryParam in queryParams) {
    if (Object.prototype.hasOwnProperty.call(queryParams, queryParam)) {
      if (
        queryParam === 'page[cursor][startAt]' ||
        queryParam === 'page[cursor][startAfter]' ||
        queryParam === 'page[cursor][endAt]' ||
        queryParam === 'page[cursor][endBefore]'
      ) {
        const [, type] = getParamAttributes(queryParam);
        const cursors = queryParams[queryParam].split(',');
        const sortings = queryParams.sort.split(',');

        paginatedModels = applyCursorToModels(
          paginatedModels,
          type,
          cursors,
          sortings,
        );
      }
    }
  }

  if (queryParams['page[limit]']) {
    paginatedModels = paginatedModels.slice(0, queryParams['page[limit]']);
  }

  return paginatedModels;
}

/**
 * Returns the attributes query param
 *
 * 'filter[message][eq]' -> ['message', 'eq']
 *
 * @param {string} param
 * @return {Array.<string>} Attribute
 */
function getParamAttributes(param) {
  const [, attribute, operator] = param.split('[');

  // Removes the last char which is ']'
  const cleanAttribute = attribute.slice(0, -1);
  const cleanOperator = operator.slice(0, -1);

  return [cleanAttribute, cleanOperator];
}

/**
 * Checks if the number of cursors matches the number of sorting attributes
 *
 * @param {Object} queryParams
 * @return {boolean} True if valid. Otherwise, false.
 */
function isNumOfCursorValid(queryParams) {
  let isNumOfCursorValid = true;
  let numOfSortings = 0;

  if (queryParams.sort) {
    numOfSortings = queryParams.sort.split(',');
  }

  for (const queryParam in queryParams) {
    if (Object.prototype.hasOwnProperty.call(queryParams, queryParam)) {
      if (
        queryParam === 'page[cursor][startAt]' ||
        queryParam === 'page[cursor][startAfter]' ||
        queryParam === 'page[cursor][endAt]' ||
        queryParam === 'page[cursor][endBefore]'
      ) {
        if (queryParam.split(',').length > numOfSortings) {
          isNumOfCursorValid = false;
          break;
        }
      }
    }
  }

  return isNumOfCursorValid;
}

/**
 * Applies cursoring to a list of models
 *
 * @param {Array.<Object>} models
 * @param {string} type
 * @param {Array.<string>} cursors
 * @param {Array.<string>} sortings
 * @return {Array.<Object>} Paginated objects
 */
function applyCursorToModels(models, type, cursors, sortings) {
  let paginatedModels = models;

  cursors.forEach((cursor, index) => {
    let lookupField = sortings[index];

    if (lookupField.startsWith('-')) {
      lookupField = lookupField.substring(1);
    }

    const cursorIndex = getCursorIndex(
      paginatedModels,
      type,
      lookupField,
      cursor,
    );

    const startIndex = (type === 'startAt' || type === 'startAfter')
      ? cursorIndex
      : 0;
    const endIndex = (type === 'endAt' || type === 'endBefore')
      ? cursorIndex
      : paginatedModels.length;

    paginatedModels = paginatedModels.slice(startIndex, endIndex);
  });

  return paginatedModels;
}

/**
 * Returns the array index of a record that matches the cursor
 *
 * @param {Array} models
 * @param {string} type
 * @param {string} field
 * @param {value} value
 * @return {number} Array index of record
 */
function getCursorIndex(models, type, field, value) {
  let cursorIndex;

  models.forEach((model, index) => {
    if (cursorIndex === undefined) {
      const modelField = model['attrs'][field];
      const parsedValue = !isNaN(value) ? parseFloat(value) : value;

      if (modelField === parsedValue) {
        if (type === 'startAt' || type === 'endBefore') {
          cursorIndex = index;
        } else if (type === 'endAt' || type === 'startAfter') {
          cursorIndex = index + 1;
        }
      } else if (modelField > parsedValue) {
        if (type === 'startAt' || type === 'startAfter') {
          cursorIndex = index;
        } else if (type === 'endAt' || type === 'endBefore') {
          cursorIndex = index - 1;
        }
      }
    }
  });

  if (cursorIndex === undefined) {
    cursorIndex = models.length;
  } else if (cursorIndex === -1) {
    cursorIndex = 0;
  }

  return cursorIndex;
}
