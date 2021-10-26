/* eslint-disable max-len */
// DO NOT MODIFY. THIS IS AUTO GENERATED.
import {
  addDoc as _addDoc,
  arrayRemove as _arrayRemove,
  arrayUnion as _arrayUnion,
  clearIndexedDbPersistence as _clearIndexedDbPersistence,
  collection as _collection,
  collectionGroup as _collectionGroup,
  connectFirestoreEmulator as _connectFirestoreEmulator,
  deleteDoc as _deleteDoc,
  deleteField as _deleteField,
  disableNetwork as _disableNetwork,
  doc as _doc,
  documentId as _documentId,
  enableIndexedDbPersistence as _enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence as _enableMultiTabIndexedDbPersistence,
  enableNetwork as _enableNetwork,
  endAt as _endAt,
  endBefore as _endBefore,
  getDoc as _getDoc,
  getDocFromCache as _getDocFromCache,
  getDocFromServer as _getDocFromServer,
  getDocs as _getDocs,
  getDocsFromCache as _getDocsFromCache,
  getDocsFromServer as _getDocsFromServer,
  getFirestore as _getFirestore,
  increment as _increment,
  initializeFirestore as _initializeFirestore,
  limit as _limit,
  limitToLast as _limitToLast,
  loadBundle as _loadBundle,
  namedQuery as _namedQuery,
  onSnapshot as _onSnapshot,
  onSnapshotsInSync as _onSnapshotsInSync,
  orderBy as _orderBy,
  query as _query,
  queryEqual as _queryEqual,
  refEqual as _refEqual,
  runTransaction as _runTransaction,
  serverTimestamp as _serverTimestamp,
  setDoc as _setDoc,
  setLogLevel as _setLogLevel,
  snapshotEqual as _snapshotEqual,
  startAfter as _startAfter,
  startAt as _startAt,
  terminate as _terminate,
  updateDoc as _updateDoc,
  waitForPendingWrites as _waitForPendingWrites,
  where as _where,
  writeBatch as _writeBatch,
} from 'firebase/firestore';

let __addDoc: typeof _addDoc = _addDoc;
let __arrayRemove: typeof _arrayRemove = _arrayRemove;
let __arrayUnion: typeof _arrayUnion = _arrayUnion;
let __clearIndexedDbPersistence: typeof _clearIndexedDbPersistence = _clearIndexedDbPersistence;
let __collection: typeof _collection = _collection;
let __collectionGroup: typeof _collectionGroup = _collectionGroup;
let __connectFirestoreEmulator: typeof _connectFirestoreEmulator = _connectFirestoreEmulator;
let __deleteDoc: typeof _deleteDoc = _deleteDoc;
let __deleteField: typeof _deleteField = _deleteField;
let __disableNetwork: typeof _disableNetwork = _disableNetwork;
let __doc: typeof _doc = _doc;
let __documentId: typeof _documentId = _documentId;
let __enableIndexedDbPersistence: typeof _enableIndexedDbPersistence = _enableIndexedDbPersistence;
let __enableMultiTabIndexedDbPersistence: typeof _enableMultiTabIndexedDbPersistence = _enableMultiTabIndexedDbPersistence;
let __enableNetwork: typeof _enableNetwork = _enableNetwork;
let __endAt: typeof _endAt = _endAt;
let __endBefore: typeof _endBefore = _endBefore;
let __getDoc: typeof _getDoc = _getDoc;
let __getDocFromCache: typeof _getDocFromCache = _getDocFromCache;
let __getDocFromServer: typeof _getDocFromServer = _getDocFromServer;
let __getDocs: typeof _getDocs = _getDocs;
let __getDocsFromCache: typeof _getDocsFromCache = _getDocsFromCache;
let __getDocsFromServer: typeof _getDocsFromServer = _getDocsFromServer;
let __getFirestore: typeof _getFirestore = _getFirestore;
let __increment: typeof _increment = _increment;
let __initializeFirestore: typeof _initializeFirestore = _initializeFirestore;
let __limit: typeof _limit = _limit;
let __limitToLast: typeof _limitToLast = _limitToLast;
let __loadBundle: typeof _loadBundle = _loadBundle;
let __namedQuery: typeof _namedQuery = _namedQuery;
let __onSnapshot: typeof _onSnapshot = _onSnapshot;
let __onSnapshotsInSync: typeof _onSnapshotsInSync = _onSnapshotsInSync;
let __orderBy: typeof _orderBy = _orderBy;
let __query: typeof _query = _query;
let __queryEqual: typeof _queryEqual = _queryEqual;
let __refEqual: typeof _refEqual = _refEqual;
let __runTransaction: typeof _runTransaction = _runTransaction;
let __serverTimestamp: typeof _serverTimestamp = _serverTimestamp;
let __setDoc: typeof _setDoc = _setDoc;
let __setLogLevel: typeof _setLogLevel = _setLogLevel;
let __snapshotEqual: typeof _snapshotEqual = _snapshotEqual;
let __startAfter: typeof _startAfter = _startAfter;
let __startAt: typeof _startAt = _startAt;
let __terminate: typeof _terminate = _terminate;
let __updateDoc: typeof _updateDoc = _updateDoc;
let __waitForPendingWrites: typeof _waitForPendingWrites = _waitForPendingWrites;
let __where: typeof _where = _where;
let __writeBatch: typeof _writeBatch = _writeBatch;

if (typeof FastBoot !== 'undefined') {
  ({
    addDoc: __addDoc,
    arrayRemove: __arrayRemove,
    arrayUnion: __arrayUnion,
    clearIndexedDbPersistence: __clearIndexedDbPersistence,
    collection: __collection,
    collectionGroup: __collectionGroup,
    connectFirestoreEmulator: __connectFirestoreEmulator,
    deleteDoc: __deleteDoc,
    deleteField: __deleteField,
    disableNetwork: __disableNetwork,
    doc: __doc,
    documentId: __documentId,
    enableIndexedDbPersistence: __enableIndexedDbPersistence,
    enableMultiTabIndexedDbPersistence: __enableMultiTabIndexedDbPersistence,
    enableNetwork: __enableNetwork,
    endAt: __endAt,
    endBefore: __endBefore,
    getDoc: __getDoc,
    getDocFromCache: __getDocFromCache,
    getDocFromServer: __getDocFromServer,
    getDocs: __getDocs,
    getDocsFromCache: __getDocsFromCache,
    getDocsFromServer: __getDocsFromServer,
    getFirestore: __getFirestore,
    increment: __increment,
    initializeFirestore: __initializeFirestore,
    limit: __limit,
    limitToLast: __limitToLast,
    loadBundle: __loadBundle,
    namedQuery: __namedQuery,
    onSnapshot: __onSnapshot,
    onSnapshotsInSync: __onSnapshotsInSync,
    orderBy: __orderBy,
    query: __query,
    queryEqual: __queryEqual,
    refEqual: __refEqual,
    runTransaction: __runTransaction,
    serverTimestamp: __serverTimestamp,
    setDoc: __setDoc,
    setLogLevel: __setLogLevel,
    snapshotEqual: __snapshotEqual,
    startAfter: __startAfter,
    startAt: __startAt,
    terminate: __terminate,
    updateDoc: __updateDoc,
    waitForPendingWrites: __waitForPendingWrites,
    where: __where,
    writeBatch: __writeBatch,
  } = FastBoot.require('firebase/firestore'));
}

export const addDoc = __addDoc;
export const arrayRemove = __arrayRemove;
export const arrayUnion = __arrayUnion;
export const clearIndexedDbPersistence = __clearIndexedDbPersistence;
export const collection = __collection;
export const collectionGroup = __collectionGroup;
export const connectFirestoreEmulator = __connectFirestoreEmulator;
export const deleteDoc = __deleteDoc;
export const deleteField = __deleteField;
export const disableNetwork = __disableNetwork;
export const doc = __doc;
export const documentId = __documentId;
export const enableIndexedDbPersistence = __enableIndexedDbPersistence;
export const enableMultiTabIndexedDbPersistence = __enableMultiTabIndexedDbPersistence;
export const enableNetwork = __enableNetwork;
export const endAt = __endAt;
export const endBefore = __endBefore;
export const getDoc = __getDoc;
export const getDocFromCache = __getDocFromCache;
export const getDocFromServer = __getDocFromServer;
export const getDocs = __getDocs;
export const getDocsFromCache = __getDocsFromCache;
export const getDocsFromServer = __getDocsFromServer;
export const getFirestore = __getFirestore;
export const increment = __increment;
export const initializeFirestore = __initializeFirestore;
export const limit = __limit;
export const limitToLast = __limitToLast;
export const loadBundle = __loadBundle;
export const namedQuery = __namedQuery;
export const onSnapshot = __onSnapshot;
export const onSnapshotsInSync = __onSnapshotsInSync;
export const orderBy = __orderBy;
export const query = __query;
export const queryEqual = __queryEqual;
export const refEqual = __refEqual;
export const runTransaction = __runTransaction;
export const serverTimestamp = __serverTimestamp;
export const setDoc = __setDoc;
export const setLogLevel = __setLogLevel;
export const snapshotEqual = __snapshotEqual;
export const startAfter = __startAfter;
export const startAt = __startAt;
export const terminate = __terminate;
export const updateDoc = __updateDoc;
export const waitForPendingWrites = __waitForPendingWrites;
export const where = __where;
export const writeBatch = __writeBatch;
