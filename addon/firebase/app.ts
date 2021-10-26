/* eslint-disable max-len */
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

let __deleteApp: typeof _deleteApp = _deleteApp;
let __getApp: typeof _getApp = _getApp;
let __getApps: typeof _getApps = _getApps;
let __initializeApp: typeof _initializeApp = _initializeApp;
let __onLog: typeof _onLog = _onLog;
let __registerVersion: typeof _registerVersion = _registerVersion;
let __setLogLevel: typeof _setLogLevel = _setLogLevel;

if (typeof FastBoot !== 'undefined') {
  ({
    deleteApp: __deleteApp,
    getApp: __getApp,
    getApps: __getApps,
    initializeApp: __initializeApp,
    onLog: __onLog,
    registerVersion: __registerVersion,
    setLogLevel: __setLogLevel,
  } = FastBoot.require('firebase/app'));
}

export const deleteApp = __deleteApp;
export const getApp = __getApp;
export const getApps = __getApps;
export const initializeApp = __initializeApp;
export const onLog = __onLog;
export const registerVersion = __registerVersion;
export const setLogLevel = __setLogLevel;
