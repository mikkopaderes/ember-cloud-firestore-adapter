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

let ___addDoc = _addDoc;
let ___arrayRemove = _arrayRemove;
let ___arrayUnion = _arrayUnion;
let ___clearIndexedDbPersistence = _clearIndexedDbPersistence;
let ___collection = _collection;
let ___collectionGroup = _collectionGroup;
let ___connectFirestoreEmulator = _connectFirestoreEmulator;
let ___deleteDoc = _deleteDoc;
let ___deleteField = _deleteField;
let ___disableNetwork = _disableNetwork;
let ___doc = _doc;
let ___documentId = _documentId;
let ___enableIndexedDbPersistence = _enableIndexedDbPersistence;
let ___enableMultiTabIndexedDbPersistence = _enableMultiTabIndexedDbPersistence;
let ___enableNetwork = _enableNetwork;
let ___endAt = _endAt;
let ___endBefore = _endBefore;
let ___getDoc = _getDoc;
let ___getDocFromCache = _getDocFromCache;
let ___getDocFromServer = _getDocFromServer;
let ___getDocs = _getDocs;
let ___getDocsFromCache = _getDocsFromCache;
let ___getDocsFromServer = _getDocsFromServer;
let ___getFirestore = _getFirestore;
let ___increment = _increment;
let ___initializeFirestore = _initializeFirestore;
let ___limit = _limit;
let ___limitToLast = _limitToLast;
let ___loadBundle = _loadBundle;
let ___namedQuery = _namedQuery;
let ___onSnapshot = _onSnapshot;
let ___onSnapshotsInSync = _onSnapshotsInSync;
let ___orderBy = _orderBy;
let ___query = _query;
let ___queryEqual = _queryEqual;
let ___refEqual = _refEqual;
let ___runTransaction = _runTransaction;
let ___serverTimestamp = _serverTimestamp;
let ___setDoc = _setDoc;
let ___setLogLevel = _setLogLevel;
let ___snapshotEqual = _snapshotEqual;
let ___startAfter = _startAfter;
let ___startAt = _startAt;
let ___terminate = _terminate;
let ___updateDoc = _updateDoc;
let ___waitForPendingWrites = _waitForPendingWrites;
let ___where = _where;
let ___writeBatch = _writeBatch;

if (typeof FastBoot !== 'undefined') {
  const {
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
  } = FastBoot.require('firebase/firestore');

  ___addDoc = __addDoc;
  ___arrayRemove = __arrayRemove;
  ___arrayUnion = __arrayUnion;
  ___clearIndexedDbPersistence = __clearIndexedDbPersistence;
  ___collection = __collection;
  ___collectionGroup = __collectionGroup;
  ___connectFirestoreEmulator = __connectFirestoreEmulator;
  ___deleteDoc = __deleteDoc;
  ___deleteField = __deleteField;
  ___disableNetwork = __disableNetwork;
  ___doc = __doc;
  ___documentId = __documentId;
  ___enableIndexedDbPersistence = __enableIndexedDbPersistence;
  ___enableMultiTabIndexedDbPersistence = __enableMultiTabIndexedDbPersistence;
  ___enableNetwork = __enableNetwork;
  ___endAt = __endAt;
  ___endBefore = __endBefore;
  ___getDoc = __getDoc;
  ___getDocFromCache = __getDocFromCache;
  ___getDocFromServer = __getDocFromServer;
  ___getDocs = __getDocs;
  ___getDocsFromCache = __getDocsFromCache;
  ___getDocsFromServer = __getDocsFromServer;
  ___getFirestore = __getFirestore;
  ___increment = __increment;
  ___initializeFirestore = __initializeFirestore;
  ___limit = __limit;
  ___limitToLast = __limitToLast;
  ___loadBundle = __loadBundle;
  ___namedQuery = __namedQuery;
  ___onSnapshot = __onSnapshot;
  ___onSnapshotsInSync = __onSnapshotsInSync;
  ___orderBy = __orderBy;
  ___query = __query;
  ___queryEqual = __queryEqual;
  ___refEqual = __refEqual;
  ___runTransaction = __runTransaction;
  ___serverTimestamp = __serverTimestamp;
  ___setDoc = __setDoc;
  ___setLogLevel = __setLogLevel;
  ___snapshotEqual = __snapshotEqual;
  ___startAfter = __startAfter;
  ___startAt = __startAt;
  ___terminate = __terminate;
  ___updateDoc = __updateDoc;
  ___waitForPendingWrites = __waitForPendingWrites;
  ___where = __where;
  ___writeBatch = __writeBatch;
}

export const addDoc = ___addDoc;
export const arrayRemove = ___arrayRemove;
export const arrayUnion = ___arrayUnion;
export const clearIndexedDbPersistence = ___clearIndexedDbPersistence;
export const collection = ___collection;
export const collectionGroup = ___collectionGroup;
export const connectFirestoreEmulator = ___connectFirestoreEmulator;
export const deleteDoc = ___deleteDoc;
export const deleteField = ___deleteField;
export const disableNetwork = ___disableNetwork;
export const doc = ___doc;
export const documentId = ___documentId;
export const enableIndexedDbPersistence = ___enableIndexedDbPersistence;
export const enableMultiTabIndexedDbPersistence = ___enableMultiTabIndexedDbPersistence;
export const enableNetwork = ___enableNetwork;
export const endAt = ___endAt;
export const endBefore = ___endBefore;
export const getDoc = ___getDoc;
export const getDocFromCache = ___getDocFromCache;
export const getDocFromServer = ___getDocFromServer;
export const getDocs = ___getDocs;
export const getDocsFromCache = ___getDocsFromCache;
export const getDocsFromServer = ___getDocsFromServer;
export const getFirestore = ___getFirestore;
export const increment = ___increment;
export const initializeFirestore = ___initializeFirestore;
export const limit = ___limit;
export const limitToLast = ___limitToLast;
export const loadBundle = ___loadBundle;
export const namedQuery = ___namedQuery;
export const onSnapshot = ___onSnapshot;
export const onSnapshotsInSync = ___onSnapshotsInSync;
export const orderBy = ___orderBy;
export const query = ___query;
export const queryEqual = ___queryEqual;
export const refEqual = ___refEqual;
export const runTransaction = ___runTransaction;
export const serverTimestamp = ___serverTimestamp;
export const setDoc = ___setDoc;
export const setLogLevel = ___setLogLevel;
export const snapshotEqual = ___snapshotEqual;
export const startAfter = ___startAfter;
export const startAt = ___startAt;
export const terminate = ___terminate;
export const updateDoc = ___updateDoc;
export const waitForPendingWrites = ___waitForPendingWrites;
export const where = ___where;
export const writeBatch = ___writeBatch;
