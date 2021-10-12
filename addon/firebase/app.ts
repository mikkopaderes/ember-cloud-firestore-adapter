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

export function deleteApp(...args: Parameters<typeof _deleteApp>): ReturnType<typeof _deleteApp> {
  if (typeof FastBoot === 'undefined') {
    return _deleteApp(...args);
  }

  const { deleteApp: __deleteApp } = FastBoot.require('firebase/app');

  return __deleteApp(...args);
}

export function getApp(...args: Parameters<typeof _getApp>): ReturnType<typeof _getApp> {
  if (typeof FastBoot === 'undefined') {
    return _getApp(...args);
  }

  const { getApp: __getApp } = FastBoot.require('firebase/app');

  return __getApp(...args);
}

export function getApps(...args: Parameters<typeof _getApps>): ReturnType<typeof _getApps> {
  if (typeof FastBoot === 'undefined') {
    return _getApps(...args);
  }

  const { getApps: __getApps } = FastBoot.require('firebase/app');

  return __getApps(...args);
}

export function initializeApp(...args: Parameters<typeof _initializeApp>): ReturnType<typeof _initializeApp> {
  if (typeof FastBoot === 'undefined') {
    return _initializeApp(...args);
  }

  const { initializeApp: __initializeApp } = FastBoot.require('firebase/app');

  return __initializeApp(...args);
}

export function onLog(...args: Parameters<typeof _onLog>): ReturnType<typeof _onLog> {
  if (typeof FastBoot === 'undefined') {
    return _onLog(...args);
  }

  const { onLog: __onLog } = FastBoot.require('firebase/app');

  return __onLog(...args);
}

export function registerVersion(...args: Parameters<typeof _registerVersion>): ReturnType<typeof _registerVersion> {
  if (typeof FastBoot === 'undefined') {
    return _registerVersion(...args);
  }

  const { registerVersion: __registerVersion } = FastBoot.require('firebase/app');

  return __registerVersion(...args);
}

export function setLogLevel(...args: Parameters<typeof _setLogLevel>): ReturnType<typeof _setLogLevel> {
  if (typeof FastBoot === 'undefined') {
    return _setLogLevel(...args);
  }

  const { setLogLevel: __setLogLevel } = FastBoot.require('firebase/app');

  return __setLogLevel(...args);
}
