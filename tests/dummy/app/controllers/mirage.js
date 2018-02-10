import Controller from '@ember/controller';

export default Controller.extend({
  users: [],

  async handleCreateRecordClick() {
    const user = await this.get('store').createRecord('user', {
      id: 'new',
      name: 'New User',
      age: 25,
    }).save();

    this.set('users', [user]);
  },

  async handleUpdateRecordClick() {
    const user = await this.get('store').findRecord('user', 'user_a');

    user.set('name', 'Updated');

    await user.save();
    this.set('users', [user]);
  },

  async handleDeleteRecordClick() {
    const users = await this.get('store').findAll('user');
    const user = users.get('firstObject');

    await user.destroyRecord();

    this.set('users', users);
  },

  async handleFindAllClick() {
    const users = await this.get('store').findAll('user');

    this.set('users', users);
  },

  async handleFindRecordClick() {
    const user = await this.get('store').findRecord('user', 'user_a');

    this.set('users', [user]);
  },

  async handleQuery1Click() {
    const users = await this.get('store').query('user', {
      filter: {
        company: { eq: 'Google' },
      },

      sort: 'age',

      page: {
        cursor: {
          startAt: 45,
          endAt: 80,
        },
      },
    });

    this.set('users', users);
  },

  async handleQuery2Click() {
    const users = await this.get('store').query('user', {
      filter: {
        company: { eq: 'Google' },
      },

      sort: 'age',

      page: {
        cursor: {
          startAfter: 33,
          endBefore: 80,
        },
      },
    });

    this.set('users', users);
  },

  async handleQuery3Click() {
    const users = await this.get('store').query('user', {
      filter: {
        company: { eq: 'Google' },
      },

      sort: '-age',

      page: {
        cursor: {
          startAt: 45,
          endAt: 80,
        },

        limit: 1,
      },
    });

    this.set('users', users);
  },

  async handleQuery4Click() {
    const users = await this.get('store').query('user', {
      path: 'users/user_a/foobar',
    });

    this.set('users', users);
  },
});
