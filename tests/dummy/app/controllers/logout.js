import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default class LogoutController extends Controller {
  @service
  session;
}
