import Controller from '@ember/controller';

export default class ApplicationController extends Controller {
  public updateRecordParam: string = Math.random().toString(32).slice(2).substr(0, 5);
}
