import Component from '@ember/component';
import layout from '../templates/components/group-members';

export default Component.extend({
  layout,

  init(...args) {
    this._super(args);

    this.get('group').loadMembers();
  },
});
