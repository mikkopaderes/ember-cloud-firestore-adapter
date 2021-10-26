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

let deleteApp: typeof _deleteApp = _deleteApp;
let getApp: typeof _getApp = _getApp;
let getApps: typeof _getApps = _getApps;
let initializeApp: typeof _initializeApp = _initializeApp;
let onLog: typeof _onLog = _onLog;
let registerVersion: typeof _registerVersion = _registerVersion;
let setLogLevel: typeof _setLogLevel = _setLogLevel;


if (typeof FastBoot !== 'undefined') {
  ({
    deleteApp,
    getApp,
    getApps,
    initializeApp,
    onLog,
    registerVersion,
    setLogLevel,
  } = FastBoot.require('firebase/app'));
}

export {
  deleteApp,
  getApp,
  getApps,
  initializeApp,
  onLog,
  registerVersion,
  setLogLevel,
};

