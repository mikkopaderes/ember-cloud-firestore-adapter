/*
  eslint
  @typescript-eslint/no-explicit-any: off,
  @typescript-eslint/explicit-module-boundary-types: off
*/

import Service from '@ember/service';
import Evented from '@ember/object/evented';

import firebase from 'firebase/compat/app';

interface Data {
  authenticated: {
    user: firebase.User;
  };
}

declare module 'ember-simple-auth/services/session' {
  export default class SessionService extends Service.extend(Evented) {
    /**
    * Triggered whenever the session is successfully authenticated. This happens
    * when the session gets authenticated via
    * {{#crossLink "SessionService/authenticate:method"}}{{/crossLink}} but also
    * when the session is authenticated in another tab or window of the same
    * application and the session state gets synchronized across tabs or windows
    * via the store (see
    * {{#crossLink "BaseStore/sessionDataUpdated:event"}}{{/crossLink}}).
    * When using the {{#crossLink "ApplicationRouteMixin"}}{{/crossLink}} this
    * event will automatically get handled (see
    * {{#crossLink "ApplicationRouteMixin/sessionAuthenticated:method"}}{{/crossLink}}).
    * @event authenticationSucceeded
    * @public
    */

    /**
    * Triggered whenever the session is successfully invalidated. This happens
    * when the session gets invalidated via
    * {{#crossLink "SessionService/invalidate:method"}}{{/crossLink}} but also
    * when the session is invalidated in another tab or window of the same
    * application and the session state gets synchronized across tabs or windows
    * via the store (see
    * {{#crossLink "BaseStore/sessionDataUpdated:event"}}{{/crossLink}}).
    * When using the {{#crossLink "ApplicationRouteMixin"}}{{/crossLink}} this
    * event will automatically get handled (see
    * {{#crossLink "ApplicationRouteMixin/sessionInvalidated:method"}}{{/crossLink}}).
    * @event invalidationSucceeded
    * @public
    */

    isAuthenticated: boolean;

    data: Data | null;

    store: any;

    attemptedTransition: any;

    session: any;

    authenticate(...args: any[]): Promise<void>;

    invalidate(...args: any): Promise<void>;

    authorize(...args: any[]): Promise<void>;
  }
}
