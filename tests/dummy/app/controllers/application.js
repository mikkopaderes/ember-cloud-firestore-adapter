import Controller from '@ember/controller';

export default Controller.extend({
  updateRecordParam: Math.random().toString(32).slice(2).substr(0, 5),
});
