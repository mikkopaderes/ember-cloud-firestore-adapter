/* eslint-disable max-len */
// DO NOT MODIFY. THIS IS AUTO GENERATED.
import {
  applyActionCode as _applyActionCode,
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

let applyActionCode: typeof _applyActionCode = _applyActionCode;
let checkActionCode: typeof _checkActionCode = _checkActionCode;
let confirmPasswordReset: typeof _confirmPasswordReset = _confirmPasswordReset;
let connectAuthEmulator: typeof _connectAuthEmulator = _connectAuthEmulator;
let createUserWithEmailAndPassword: typeof _createUserWithEmailAndPassword = _createUserWithEmailAndPassword;
let deleteUser: typeof _deleteUser = _deleteUser;
let fetchSignInMethodsForEmail: typeof _fetchSignInMethodsForEmail = _fetchSignInMethodsForEmail;
let getAdditionalUserInfo: typeof _getAdditionalUserInfo = _getAdditionalUserInfo;
let getAuth: typeof _getAuth = _getAuth;
let getIdToken: typeof _getIdToken = _getIdToken;
let getIdTokenResult: typeof _getIdTokenResult = _getIdTokenResult;
let getMultiFactorResolver: typeof _getMultiFactorResolver = _getMultiFactorResolver;
let getRedirectResult: typeof _getRedirectResult = _getRedirectResult;
let initializeAuth: typeof _initializeAuth = _initializeAuth;
let isSignInWithEmailLink: typeof _isSignInWithEmailLink = _isSignInWithEmailLink;
let linkWithCredential: typeof _linkWithCredential = _linkWithCredential;
let linkWithPhoneNumber: typeof _linkWithPhoneNumber = _linkWithPhoneNumber;
let linkWithPopup: typeof _linkWithPopup = _linkWithPopup;
let linkWithRedirect: typeof _linkWithRedirect = _linkWithRedirect;
let multiFactor: typeof _multiFactor = _multiFactor;
let onAuthStateChanged: typeof _onAuthStateChanged = _onAuthStateChanged;
let onIdTokenChanged: typeof _onIdTokenChanged = _onIdTokenChanged;
let parseActionCodeURL: typeof _parseActionCodeURL = _parseActionCodeURL;
let reauthenticateWithCredential: typeof _reauthenticateWithCredential = _reauthenticateWithCredential;
let reauthenticateWithPhoneNumber: typeof _reauthenticateWithPhoneNumber = _reauthenticateWithPhoneNumber;
let reauthenticateWithPopup: typeof _reauthenticateWithPopup = _reauthenticateWithPopup;
let reauthenticateWithRedirect: typeof _reauthenticateWithRedirect = _reauthenticateWithRedirect;
let reload: typeof _reload = _reload;
let sendEmailVerification: typeof _sendEmailVerification = _sendEmailVerification;
let sendPasswordResetEmail: typeof _sendPasswordResetEmail = _sendPasswordResetEmail;
let sendSignInLinkToEmail: typeof _sendSignInLinkToEmail = _sendSignInLinkToEmail;
let setPersistence: typeof _setPersistence = _setPersistence;
let signInAnonymously: typeof _signInAnonymously = _signInAnonymously;
let signInWithCredential: typeof _signInWithCredential = _signInWithCredential;
let signInWithCustomToken: typeof _signInWithCustomToken = _signInWithCustomToken;
let signInWithEmailAndPassword: typeof _signInWithEmailAndPassword = _signInWithEmailAndPassword;
let signInWithEmailLink: typeof _signInWithEmailLink = _signInWithEmailLink;
let signInWithPhoneNumber: typeof _signInWithPhoneNumber = _signInWithPhoneNumber;
let signInWithPopup: typeof _signInWithPopup = _signInWithPopup;
let signInWithRedirect: typeof _signInWithRedirect = _signInWithRedirect;
let signOut: typeof _signOut = _signOut;
let unlink: typeof _unlink = _unlink;
let updateCurrentUser: typeof _updateCurrentUser = _updateCurrentUser;
let updateEmail: typeof _updateEmail = _updateEmail;
let updatePassword: typeof _updatePassword = _updatePassword;
let updatePhoneNumber: typeof _updatePhoneNumber = _updatePhoneNumber;
let updateProfile: typeof _updateProfile = _updateProfile;
let useDeviceLanguage: typeof _useDeviceLanguage = _useDeviceLanguage;
let verifyBeforeUpdateEmail: typeof _verifyBeforeUpdateEmail = _verifyBeforeUpdateEmail;
let verifyPasswordResetCode: typeof _verifyPasswordResetCode = _verifyPasswordResetCode;


if (typeof FastBoot !== 'undefined') {
  ({
    applyActionCode,
    checkActionCode,
    confirmPasswordReset,
    connectAuthEmulator,
    createUserWithEmailAndPassword,
    deleteUser,
    fetchSignInMethodsForEmail,
    getAdditionalUserInfo,
    getAuth,
    getIdToken,
    getIdTokenResult,
    getMultiFactorResolver,
    getRedirectResult,
    initializeAuth,
    isSignInWithEmailLink,
    linkWithCredential,
    linkWithPhoneNumber,
    linkWithPopup,
    linkWithRedirect,
    multiFactor,
    onAuthStateChanged,
    onIdTokenChanged,
    parseActionCodeURL,
    reauthenticateWithCredential,
    reauthenticateWithPhoneNumber,
    reauthenticateWithPopup,
    reauthenticateWithRedirect,
    reload,
    sendEmailVerification,
    sendPasswordResetEmail,
    sendSignInLinkToEmail,
    setPersistence,
    signInAnonymously,
    signInWithCredential,
    signInWithCustomToken,
    signInWithEmailAndPassword,
    signInWithEmailLink,
    signInWithPhoneNumber,
    signInWithPopup,
    signInWithRedirect,
    signOut,
    unlink,
    updateCurrentUser,
    updateEmail,
    updatePassword,
    updatePhoneNumber,
    updateProfile,
    useDeviceLanguage,
    verifyBeforeUpdateEmail,
    verifyPasswordResetCode,
  } = FastBoot.require('firebase/auth'));
}

export {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  fetchSignInMethodsForEmail,
  getAdditionalUserInfo,
  getAuth,
  getIdToken,
  getIdTokenResult,
  getMultiFactorResolver,
  getRedirectResult,
  initializeAuth,
  isSignInWithEmailLink,
  linkWithCredential,
  linkWithPhoneNumber,
  linkWithPopup,
  linkWithRedirect,
  multiFactor,
  onAuthStateChanged,
  onIdTokenChanged,
  parseActionCodeURL,
  reauthenticateWithCredential,
  reauthenticateWithPhoneNumber,
  reauthenticateWithPopup,
  reauthenticateWithRedirect,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  setPersistence,
  signInAnonymously,
  signInWithCredential,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  unlink,
  updateCurrentUser,
  updateEmail,
  updatePassword,
  updatePhoneNumber,
  updateProfile,
  useDeviceLanguage,
  verifyBeforeUpdateEmail,
  verifyPasswordResetCode,
};

