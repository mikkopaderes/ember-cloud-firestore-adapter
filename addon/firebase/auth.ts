/* eslint-disable */
// DO NOT MODIFY. THIS IS AUTO GENERATED.
import {
  applyActionCode as _applyActionCode,
  browserLocalPersistence as _browserLocalPersistence,
  browserSessionPersistence as _browserSessionPersistence,
  checkActionCode as _checkActionCode,
  confirmPasswordReset as _confirmPasswordReset,
  connectAuthEmulator as _connectAuthEmulator,
  createUserWithEmailAndPassword as _createUserWithEmailAndPassword,
  deleteUser as _deleteUser,
  fetchSignInMethodsForEmail as _fetchSignInMethodsForEmail,
  getAdditionalUserInfo as _getAdditionalUserInfo,
  getAuth as _getAuth,
  getIdToken as _getIdToken,
  getIdTokenResult as _getIdTokenResult,
  getMultiFactorResolver as _getMultiFactorResolver,
  getRedirectResult as _getRedirectResult,
  indexedDBLocalPersistence as _indexedDBLocalPersistence,
  initializeAuth as _initializeAuth,
  isSignInWithEmailLink as _isSignInWithEmailLink,
  linkWithCredential as _linkWithCredential,
  linkWithPhoneNumber as _linkWithPhoneNumber,
  linkWithPopup as _linkWithPopup,
  linkWithRedirect as _linkWithRedirect,
  multiFactor as _multiFactor,
  onAuthStateChanged as _onAuthStateChanged,
  onIdTokenChanged as _onIdTokenChanged,
  parseActionCodeURL as _parseActionCodeURL,
  reauthenticateWithCredential as _reauthenticateWithCredential,
  reauthenticateWithPhoneNumber as _reauthenticateWithPhoneNumber,
  reauthenticateWithPopup as _reauthenticateWithPopup,
  reauthenticateWithRedirect as _reauthenticateWithRedirect,
  reload as _reload,
  sendEmailVerification as _sendEmailVerification,
  sendPasswordResetEmail as _sendPasswordResetEmail,
  sendSignInLinkToEmail as _sendSignInLinkToEmail,
  setPersistence as _setPersistence,
  signInAnonymously as _signInAnonymously,
  signInWithCredential as _signInWithCredential,
  signInWithCustomToken as _signInWithCustomToken,
  signInWithEmailAndPassword as _signInWithEmailAndPassword,
  signInWithEmailLink as _signInWithEmailLink,
  signInWithPhoneNumber as _signInWithPhoneNumber,
  signInWithPopup as _signInWithPopup,
  signInWithRedirect as _signInWithRedirect,
  signOut as _signOut,
  unlink as _unlink,
  updateCurrentUser as _updateCurrentUser,
  updateEmail as _updateEmail,
  updatePassword as _updatePassword,
  updatePhoneNumber as _updatePhoneNumber,
  updateProfile as _updateProfile,
  useDeviceLanguage as _useDeviceLanguage,
  verifyBeforeUpdateEmail as _verifyBeforeUpdateEmail,
  verifyPasswordResetCode as _verifyPasswordResetCode,
} from 'firebase/auth';

let __applyActionCode: typeof _applyActionCode = _applyActionCode;
let __browserLocalPersistence: typeof _browserLocalPersistence = _browserLocalPersistence;
let __browserSessionPersistence: typeof _browserSessionPersistence = _browserSessionPersistence;
let __checkActionCode: typeof _checkActionCode = _checkActionCode;
let __confirmPasswordReset: typeof _confirmPasswordReset = _confirmPasswordReset;
let __connectAuthEmulator: typeof _connectAuthEmulator = _connectAuthEmulator;
let __createUserWithEmailAndPassword: typeof _createUserWithEmailAndPassword = _createUserWithEmailAndPassword;
let __deleteUser: typeof _deleteUser = _deleteUser;
let __fetchSignInMethodsForEmail: typeof _fetchSignInMethodsForEmail = _fetchSignInMethodsForEmail;
let __getAdditionalUserInfo: typeof _getAdditionalUserInfo = _getAdditionalUserInfo;
let __getAuth: typeof _getAuth = _getAuth;
let __getIdToken: typeof _getIdToken = _getIdToken;
let __getIdTokenResult: typeof _getIdTokenResult = _getIdTokenResult;
let __getMultiFactorResolver: typeof _getMultiFactorResolver = _getMultiFactorResolver;
let __getRedirectResult: typeof _getRedirectResult = _getRedirectResult;
let __indexedDBLocalPersistence: typeof _indexedDBLocalPersistence = _indexedDBLocalPersistence;
let __initializeAuth: typeof _initializeAuth = _initializeAuth;
let __isSignInWithEmailLink: typeof _isSignInWithEmailLink = _isSignInWithEmailLink;
let __linkWithCredential: typeof _linkWithCredential = _linkWithCredential;
let __linkWithPhoneNumber: typeof _linkWithPhoneNumber = _linkWithPhoneNumber;
let __linkWithPopup: typeof _linkWithPopup = _linkWithPopup;
let __linkWithRedirect: typeof _linkWithRedirect = _linkWithRedirect;
let __multiFactor: typeof _multiFactor = _multiFactor;
let __onAuthStateChanged: typeof _onAuthStateChanged = _onAuthStateChanged;
let __onIdTokenChanged: typeof _onIdTokenChanged = _onIdTokenChanged;
let __parseActionCodeURL: typeof _parseActionCodeURL = _parseActionCodeURL;
let __reauthenticateWithCredential: typeof _reauthenticateWithCredential = _reauthenticateWithCredential;
let __reauthenticateWithPhoneNumber: typeof _reauthenticateWithPhoneNumber = _reauthenticateWithPhoneNumber;
let __reauthenticateWithPopup: typeof _reauthenticateWithPopup = _reauthenticateWithPopup;
let __reauthenticateWithRedirect: typeof _reauthenticateWithRedirect = _reauthenticateWithRedirect;
let __reload: typeof _reload = _reload;
let __sendEmailVerification: typeof _sendEmailVerification = _sendEmailVerification;
let __sendPasswordResetEmail: typeof _sendPasswordResetEmail = _sendPasswordResetEmail;
let __sendSignInLinkToEmail: typeof _sendSignInLinkToEmail = _sendSignInLinkToEmail;
let __setPersistence: typeof _setPersistence = _setPersistence;
let __signInAnonymously: typeof _signInAnonymously = _signInAnonymously;
let __signInWithCredential: typeof _signInWithCredential = _signInWithCredential;
let __signInWithCustomToken: typeof _signInWithCustomToken = _signInWithCustomToken;
let __signInWithEmailAndPassword: typeof _signInWithEmailAndPassword = _signInWithEmailAndPassword;
let __signInWithEmailLink: typeof _signInWithEmailLink = _signInWithEmailLink;
let __signInWithPhoneNumber: typeof _signInWithPhoneNumber = _signInWithPhoneNumber;
let __signInWithPopup: typeof _signInWithPopup = _signInWithPopup;
let __signInWithRedirect: typeof _signInWithRedirect = _signInWithRedirect;
let __signOut: typeof _signOut = _signOut;
let __unlink: typeof _unlink = _unlink;
let __updateCurrentUser: typeof _updateCurrentUser = _updateCurrentUser;
let __updateEmail: typeof _updateEmail = _updateEmail;
let __updatePassword: typeof _updatePassword = _updatePassword;
let __updatePhoneNumber: typeof _updatePhoneNumber = _updatePhoneNumber;
let __updateProfile: typeof _updateProfile = _updateProfile;
let __useDeviceLanguage: typeof _useDeviceLanguage = _useDeviceLanguage;
let __verifyBeforeUpdateEmail: typeof _verifyBeforeUpdateEmail = _verifyBeforeUpdateEmail;
let __verifyPasswordResetCode: typeof _verifyPasswordResetCode = _verifyPasswordResetCode;

if (typeof FastBoot !== 'undefined') {
  ({
    applyActionCode: __applyActionCode,
    browserLocalPersistence: __browserLocalPersistence,
    browserSessionPersistence: __browserSessionPersistence,
    checkActionCode: __checkActionCode,
    confirmPasswordReset: __confirmPasswordReset,
    connectAuthEmulator: __connectAuthEmulator,
    createUserWithEmailAndPassword: __createUserWithEmailAndPassword,
    deleteUser: __deleteUser,
    fetchSignInMethodsForEmail: __fetchSignInMethodsForEmail,
    getAdditionalUserInfo: __getAdditionalUserInfo,
    getAuth: __getAuth,
    getIdToken: __getIdToken,
    getIdTokenResult: __getIdTokenResult,
    getMultiFactorResolver: __getMultiFactorResolver,
    getRedirectResult: __getRedirectResult,
    indexedDBLocalPersistence: __indexedDBLocalPersistence,
    initializeAuth: __initializeAuth,
    isSignInWithEmailLink: __isSignInWithEmailLink,
    linkWithCredential: __linkWithCredential,
    linkWithPhoneNumber: __linkWithPhoneNumber,
    linkWithPopup: __linkWithPopup,
    linkWithRedirect: __linkWithRedirect,
    multiFactor: __multiFactor,
    onAuthStateChanged: __onAuthStateChanged,
    onIdTokenChanged: __onIdTokenChanged,
    parseActionCodeURL: __parseActionCodeURL,
    reauthenticateWithCredential: __reauthenticateWithCredential,
    reauthenticateWithPhoneNumber: __reauthenticateWithPhoneNumber,
    reauthenticateWithPopup: __reauthenticateWithPopup,
    reauthenticateWithRedirect: __reauthenticateWithRedirect,
    reload: __reload,
    sendEmailVerification: __sendEmailVerification,
    sendPasswordResetEmail: __sendPasswordResetEmail,
    sendSignInLinkToEmail: __sendSignInLinkToEmail,
    setPersistence: __setPersistence,
    signInAnonymously: __signInAnonymously,
    signInWithCredential: __signInWithCredential,
    signInWithCustomToken: __signInWithCustomToken,
    signInWithEmailAndPassword: __signInWithEmailAndPassword,
    signInWithEmailLink: __signInWithEmailLink,
    signInWithPhoneNumber: __signInWithPhoneNumber,
    signInWithPopup: __signInWithPopup,
    signInWithRedirect: __signInWithRedirect,
    signOut: __signOut,
    unlink: __unlink,
    updateCurrentUser: __updateCurrentUser,
    updateEmail: __updateEmail,
    updatePassword: __updatePassword,
    updatePhoneNumber: __updatePhoneNumber,
    updateProfile: __updateProfile,
    useDeviceLanguage: __useDeviceLanguage,
    verifyBeforeUpdateEmail: __verifyBeforeUpdateEmail,
    verifyPasswordResetCode: __verifyPasswordResetCode,
  } = FastBoot.require('firebase/auth'));
}

export const applyActionCode = __applyActionCode;
export const browserLocalPersistence = __browserLocalPersistence;
export const browserSessionPersistence = __browserSessionPersistence;
export const checkActionCode = __checkActionCode;
export const confirmPasswordReset = __confirmPasswordReset;
export const connectAuthEmulator = __connectAuthEmulator;
export const createUserWithEmailAndPassword = __createUserWithEmailAndPassword;
export const deleteUser = __deleteUser;
export const fetchSignInMethodsForEmail = __fetchSignInMethodsForEmail;
export const getAdditionalUserInfo = __getAdditionalUserInfo;
export const getAuth = __getAuth;
export const getIdToken = __getIdToken;
export const getIdTokenResult = __getIdTokenResult;
export const getMultiFactorResolver = __getMultiFactorResolver;
export const getRedirectResult = __getRedirectResult;
export const indexedDBLocalPersistence = __indexedDBLocalPersistence;
export const initializeAuth = __initializeAuth;
export const isSignInWithEmailLink = __isSignInWithEmailLink;
export const linkWithCredential = __linkWithCredential;
export const linkWithPhoneNumber = __linkWithPhoneNumber;
export const linkWithPopup = __linkWithPopup;
export const linkWithRedirect = __linkWithRedirect;
export const multiFactor = __multiFactor;
export const onAuthStateChanged = __onAuthStateChanged;
export const onIdTokenChanged = __onIdTokenChanged;
export const parseActionCodeURL = __parseActionCodeURL;
export const reauthenticateWithCredential = __reauthenticateWithCredential;
export const reauthenticateWithPhoneNumber = __reauthenticateWithPhoneNumber;
export const reauthenticateWithPopup = __reauthenticateWithPopup;
export const reauthenticateWithRedirect = __reauthenticateWithRedirect;
export const reload = __reload;
export const sendEmailVerification = __sendEmailVerification;
export const sendPasswordResetEmail = __sendPasswordResetEmail;
export const sendSignInLinkToEmail = __sendSignInLinkToEmail;
export const setPersistence = __setPersistence;
export const signInAnonymously = __signInAnonymously;
export const signInWithCredential = __signInWithCredential;
export const signInWithCustomToken = __signInWithCustomToken;
export const signInWithEmailAndPassword = __signInWithEmailAndPassword;
export const signInWithEmailLink = __signInWithEmailLink;
export const signInWithPhoneNumber = __signInWithPhoneNumber;
export const signInWithPopup = __signInWithPopup;
export const signInWithRedirect = __signInWithRedirect;
export const signOut = __signOut;
export const unlink = __unlink;
export const updateCurrentUser = __updateCurrentUser;
export const updateEmail = __updateEmail;
export const updatePassword = __updatePassword;
export const updatePhoneNumber = __updatePhoneNumber;
export const updateProfile = __updateProfile;
export const useDeviceLanguage = __useDeviceLanguage;
export const verifyBeforeUpdateEmail = __verifyBeforeUpdateEmail;
export const verifyPasswordResetCode = __verifyPasswordResetCode;
