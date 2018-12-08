import Controller from '@ember/controller';

export default Controller.extend({
  users: [],

  async handleCreateRecordClick() {
    const user = await this.store.createRecord('user', {
      id: 'new',
      username: 'new_user',
      age: 25,
    }).save({
      adapterOptions: { onServer: true },
    });

    this.set('users', [user]);
  },

  async handleUpdateRecordClick() {
    const user = await this.store.findRecord('user', 'user_a');

    user.set('username', 'updated_user');

    await user.save({
      adapterOptions: { onServer: true },
    });
    this.set('users', [user]);
  },

  async handleDeleteRecordClick() {
    const users = await this.store.findAll('user');
    const user = users.get('firstObject');

    await user.destroyRecord({
      adapterOptions: { onServer: true },
    });

    this.set('users', users);
  },

  async handleFindAllClick() {
    const users = await this.store.findAll('user');

    this.set('users', users);
  },

  async handleFindRecordClick() {
    const user = await this.store.findRecord('user', 'user_a');

    this.set('users', [user]);
  },

  async handleQuery1Click() {
    const users = await this.store.query('user', {
      filter(reference) {
        return reference.where('age', '>=', '15');
      },
    });

    this.set('users', users);
  },

  async handleQuery2Click() {
    const users = await this.store.query('user', {
      buildReference(db) {
        return db.collection('users').doc('user_a').collection('foobar');
      },
    });

    this.set('users', users);
  },
});
