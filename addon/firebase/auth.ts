// DO NOT MODIFY. THIS IS AUTO GENERATED.
import {
  applyActionCode as _applyActionCode,
  checkActionCode as _checkActionCode,
  confirmPasswordReset as _confirmPasswordReset,
  connectAuthEmulator as _connectAuthEmulator,
  createUserWithEmailAndPassword as _createUserWithEmailAndPassword,
  debugErrorMap as _debugErrorMap,
  deleteUser as _deleteUser,
  fetchSignInMethodsForEmail as _fetchSignInMethodsForEmail,
  getAdditionalUserInfo as _getAdditionalUserInfo,
  getAuth as _getAuth,
  getIdToken as _getIdToken,
  getIdTokenResult as _getIdTokenResult,
  getMultiFactorResolver as _getMultiFactorResolver,
  getRedirectResult as _getRedirectResult,
  inMemoryPersistence as _inMemoryPersistence,
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
  prodErrorMap as _prodErrorMap,
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

let ___applyActionCode = _applyActionCode;
let ___checkActionCode = _checkActionCode;
let ___confirmPasswordReset = _confirmPasswordReset;
let ___connectAuthEmulator = _connectAuthEmulator;
let ___createUserWithEmailAndPassword = _createUserWithEmailAndPassword;
let ___debugErrorMap = _debugErrorMap;
let ___deleteUser = _deleteUser;
let ___fetchSignInMethodsForEmail = _fetchSignInMethodsForEmail;
let ___getAdditionalUserInfo = _getAdditionalUserInfo;
let ___getAuth = _getAuth;
let ___getIdToken = _getIdToken;
let ___getIdTokenResult = _getIdTokenResult;
let ___getMultiFactorResolver = _getMultiFactorResolver;
let ___getRedirectResult = _getRedirectResult;
let ___inMemoryPersistence = _inMemoryPersistence;
let ___initializeAuth = _initializeAuth;
let ___isSignInWithEmailLink = _isSignInWithEmailLink;
let ___linkWithCredential = _linkWithCredential;
let ___linkWithPhoneNumber = _linkWithPhoneNumber;
let ___linkWithPopup = _linkWithPopup;
let ___linkWithRedirect = _linkWithRedirect;
let ___multiFactor = _multiFactor;
let ___onAuthStateChanged = _onAuthStateChanged;
let ___onIdTokenChanged = _onIdTokenChanged;
let ___parseActionCodeURL = _parseActionCodeURL;
let ___prodErrorMap = _prodErrorMap;
let ___reauthenticateWithCredential = _reauthenticateWithCredential;
let ___reauthenticateWithPhoneNumber = _reauthenticateWithPhoneNumber;
let ___reauthenticateWithPopup = _reauthenticateWithPopup;
let ___reauthenticateWithRedirect = _reauthenticateWithRedirect;
let ___reload = _reload;
let ___sendEmailVerification = _sendEmailVerification;
let ___sendPasswordResetEmail = _sendPasswordResetEmail;
let ___sendSignInLinkToEmail = _sendSignInLinkToEmail;
let ___setPersistence = _setPersistence;
let ___signInAnonymously = _signInAnonymously;
let ___signInWithCredential = _signInWithCredential;
let ___signInWithCustomToken = _signInWithCustomToken;
let ___signInWithEmailAndPassword = _signInWithEmailAndPassword;
let ___signInWithEmailLink = _signInWithEmailLink;
let ___signInWithPhoneNumber = _signInWithPhoneNumber;
let ___signInWithPopup = _signInWithPopup;
let ___signInWithRedirect = _signInWithRedirect;
let ___signOut = _signOut;
let ___unlink = _unlink;
let ___updateCurrentUser = _updateCurrentUser;
let ___updateEmail = _updateEmail;
let ___updatePassword = _updatePassword;
let ___updatePhoneNumber = _updatePhoneNumber;
let ___updateProfile = _updateProfile;
let ___useDeviceLanguage = _useDeviceLanguage;
let ___verifyBeforeUpdateEmail = _verifyBeforeUpdateEmail;
let ___verifyPasswordResetCode = _verifyPasswordResetCode;

if (typeof FastBoot !== 'undefined') {
  const {
    applyActionCode: __applyActionCode,
    checkActionCode: __checkActionCode,
    confirmPasswordReset: __confirmPasswordReset,
    connectAuthEmulator: __connectAuthEmulator,
    createUserWithEmailAndPassword: __createUserWithEmailAndPassword,
    debugErrorMap: __debugErrorMap,
    deleteUser: __deleteUser,
    fetchSignInMethodsForEmail: __fetchSignInMethodsForEmail,
    getAdditionalUserInfo: __getAdditionalUserInfo,
    getAuth: __getAuth,
    getIdToken: __getIdToken,
    getIdTokenResult: __getIdTokenResult,
    getMultiFactorResolver: __getMultiFactorResolver,
    getRedirectResult: __getRedirectResult,
    inMemoryPersistence: __inMemoryPersistence,
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
    prodErrorMap: __prodErrorMap,
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
  } = FastBoot.require('firebase/auth');

  ___applyActionCode = __applyActionCode;
  ___checkActionCode = __checkActionCode;
  ___confirmPasswordReset = __confirmPasswordReset;
  ___connectAuthEmulator = __connectAuthEmulator;
  ___createUserWithEmailAndPassword = __createUserWithEmailAndPassword;
  ___debugErrorMap = __debugErrorMap;
  ___deleteUser = __deleteUser;
  ___fetchSignInMethodsForEmail = __fetchSignInMethodsForEmail;
  ___getAdditionalUserInfo = __getAdditionalUserInfo;
  ___getAuth = __getAuth;
  ___getIdToken = __getIdToken;
  ___getIdTokenResult = __getIdTokenResult;
  ___getMultiFactorResolver = __getMultiFactorResolver;
  ___getRedirectResult = __getRedirectResult;
  ___inMemoryPersistence = __inMemoryPersistence;
  ___initializeAuth = __initializeAuth;
  ___isSignInWithEmailLink = __isSignInWithEmailLink;
  ___linkWithCredential = __linkWithCredential;
  ___linkWithPhoneNumber = __linkWithPhoneNumber;
  ___linkWithPopup = __linkWithPopup;
  ___linkWithRedirect = __linkWithRedirect;
  ___multiFactor = __multiFactor;
  ___onAuthStateChanged = __onAuthStateChanged;
  ___onIdTokenChanged = __onIdTokenChanged;
  ___parseActionCodeURL = __parseActionCodeURL;
  ___prodErrorMap = __prodErrorMap;
  ___reauthenticateWithCredential = __reauthenticateWithCredential;
  ___reauthenticateWithPhoneNumber = __reauthenticateWithPhoneNumber;
  ___reauthenticateWithPopup = __reauthenticateWithPopup;
  ___reauthenticateWithRedirect = __reauthenticateWithRedirect;
  ___reload = __reload;
  ___sendEmailVerification = __sendEmailVerification;
  ___sendPasswordResetEmail = __sendPasswordResetEmail;
  ___sendSignInLinkToEmail = __sendSignInLinkToEmail;
  ___setPersistence = __setPersistence;
  ___signInAnonymously = __signInAnonymously;
  ___signInWithCredential = __signInWithCredential;
  ___signInWithCustomToken = __signInWithCustomToken;
  ___signInWithEmailAndPassword = __signInWithEmailAndPassword;
  ___signInWithEmailLink = __signInWithEmailLink;
  ___signInWithPhoneNumber = __signInWithPhoneNumber;
  ___signInWithPopup = __signInWithPopup;
  ___signInWithRedirect = __signInWithRedirect;
  ___signOut = __signOut;
  ___unlink = __unlink;
  ___updateCurrentUser = __updateCurrentUser;
  ___updateEmail = __updateEmail;
  ___updatePassword = __updatePassword;
  ___updatePhoneNumber = __updatePhoneNumber;
  ___updateProfile = __updateProfile;
  ___useDeviceLanguage = __useDeviceLanguage;
  ___verifyBeforeUpdateEmail = __verifyBeforeUpdateEmail;
  ___verifyPasswordResetCode = __verifyPasswordResetCode;
}

export const applyActionCode = ___applyActionCode;
export const checkActionCode = ___checkActionCode;
export const confirmPasswordReset = ___confirmPasswordReset;
export const connectAuthEmulator = ___connectAuthEmulator;
export const createUserWithEmailAndPassword = ___createUserWithEmailAndPassword;
export const debugErrorMap = ___debugErrorMap;
export const deleteUser = ___deleteUser;
export const fetchSignInMethodsForEmail = ___fetchSignInMethodsForEmail;
export const getAdditionalUserInfo = ___getAdditionalUserInfo;
export const getAuth = ___getAuth;
export const getIdToken = ___getIdToken;
export const getIdTokenResult = ___getIdTokenResult;
export const getMultiFactorResolver = ___getMultiFactorResolver;
export const getRedirectResult = ___getRedirectResult;
export const inMemoryPersistence = ___inMemoryPersistence;
export const initializeAuth = ___initializeAuth;
export const isSignInWithEmailLink = ___isSignInWithEmailLink;
export const linkWithCredential = ___linkWithCredential;
export const linkWithPhoneNumber = ___linkWithPhoneNumber;
export const linkWithPopup = ___linkWithPopup;
export const linkWithRedirect = ___linkWithRedirect;
export const multiFactor = ___multiFactor;
export const onAuthStateChanged = ___onAuthStateChanged;
export const onIdTokenChanged = ___onIdTokenChanged;
export const parseActionCodeURL = ___parseActionCodeURL;
export const prodErrorMap = ___prodErrorMap;
export const reauthenticateWithCredential = ___reauthenticateWithCredential;
export const reauthenticateWithPhoneNumber = ___reauthenticateWithPhoneNumber;
export const reauthenticateWithPopup = ___reauthenticateWithPopup;
export const reauthenticateWithRedirect = ___reauthenticateWithRedirect;
export const reload = ___reload;
export const sendEmailVerification = ___sendEmailVerification;
export const sendPasswordResetEmail = ___sendPasswordResetEmail;
export const sendSignInLinkToEmail = ___sendSignInLinkToEmail;
export const setPersistence = ___setPersistence;
export const signInAnonymously = ___signInAnonymously;
export const signInWithCredential = ___signInWithCredential;
export const signInWithCustomToken = ___signInWithCustomToken;
export const signInWithEmailAndPassword = ___signInWithEmailAndPassword;
export const signInWithEmailLink = ___signInWithEmailLink;
export const signInWithPhoneNumber = ___signInWithPhoneNumber;
export const signInWithPopup = ___signInWithPopup;
export const signInWithRedirect = ___signInWithRedirect;
export const signOut = ___signOut;
export const unlink = ___unlink;
export const updateCurrentUser = ___updateCurrentUser;
export const updateEmail = ___updateEmail;
export const updatePassword = ___updatePassword;
export const updatePhoneNumber = ___updatePhoneNumber;
export const updateProfile = ___updateProfile;
export const useDeviceLanguage = ___useDeviceLanguage;
export const verifyBeforeUpdateEmail = ___verifyBeforeUpdateEmail;
export const verifyPasswordResetCode = ___verifyPasswordResetCode;
