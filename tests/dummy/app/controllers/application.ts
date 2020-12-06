import Controller from '@ember/controller';

export default class ApplicationController extends Controller {
  updateRecordParam = Math.random().toString(32).slice(2).substr(0, 5);
}
