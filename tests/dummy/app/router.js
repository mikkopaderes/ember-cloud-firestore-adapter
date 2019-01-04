import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('query');
  this.route('find-all');
  this.route('find-record');
  this.route('create-record');
  this.route('update-record', { path: '/update-record/:title' });
  this.route('delete-record');
  this.route('reset-data');
  this.route('features');
  this.route('login');
  this.route('logout');
});

export default Router;
