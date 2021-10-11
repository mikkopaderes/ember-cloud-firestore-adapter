// DO NOT MODIFY. THIS IS AUTO GENERATED.
import {
  deleteApp as _deleteApp,
  getApp as _getApp,
  getApps as _getApps,
  initializeApp as _initializeApp,
  onLog as _onLog,
  registerVersion as _registerVersion,
  setLogLevel as _setLogLevel,
} from 'firebase/app';

let ___deleteApp = _deleteApp;
let ___getApp = _getApp;
let ___getApps = _getApps;
let ___initializeApp = _initializeApp;
let ___onLog = _onLog;
let ___registerVersion = _registerVersion;
let ___setLogLevel = _setLogLevel;

if (typeof FastBoot !== 'undefined') {
  const {
    deleteApp: __deleteApp,
    getApp: __getApp,
    getApps: __getApps,
    initializeApp: __initializeApp,
    onLog: __onLog,
    registerVersion: __registerVersion,
    setLogLevel: __setLogLevel,
  } = FastBoot.require('firebase/app');

  ___deleteApp = __deleteApp;
  ___getApp = __getApp;
  ___getApps = __getApps;
  ___initializeApp = __initializeApp;
  ___onLog = __onLog;
  ___registerVersion = __registerVersion;
  ___setLogLevel = __setLogLevel;
}

export const deleteApp = ___deleteApp;
export const getApp = ___getApp;
export const getApps = ___getApps;
export const initializeApp = ___initializeApp;
export const onLog = ___onLog;
export const registerVersion = ___registerVersion;
export const setLogLevel = ___setLogLevel;
