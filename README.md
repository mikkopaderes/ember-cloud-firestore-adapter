ember-cloud-firestore-adapter
==============================================================================

This is an unofficial Ember Data Adapter and Serializer for Cloud Firestore. It's completely unrelated to [EmberFire](https://github.com/firebase/emberfire) but its purpose is of the same.

Features
------------------------------------------------------------------------------

- **Customizable data structure** - There's an opinionated default on how your data will be structured but there's enough API to make it fit to your existing ones
- **Realtime bindings** - Listen to realtime updates easily
- **Authentication** - Integrate [Firebase Authentication](https://firebase.google.com/products/auth/) powered by [Ember Simple Auth](https://github.com/simplabs/ember-simple-auth)
- **FastBoot support** - Perform server-side rendering to speed up your boot time
- **Firebase Emulator** - Develop and test your app using the [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite)

Why Was This Built?
------------------------------------------------------------------------------

This was built becase EmberFire development is super slow or may even be abandoned by now.

In order to continue development with Ember and Cloud Firestore, I had to build this addon and opted to make it generic enough to be used by other developers too.

Compatibility
------------------------------------------------------------------------------

* Ember.js v3.20 or above
* Ember CLI v3.20 or above
* Node.js v12 or above

Installation
------------------------------------------------------------------------------

This addon requires some peer dependencies. Install the correct versions of each package, which are listed by the command:

```
npm info ember-cloud-firestore-adapter peerDependencies
```

Once you've installed it, you can now install the addon itself:

```
ember install ember-cloud-firestore-adapter
```

Getting Started
------------------------------------------------------------------------------

Checkout the docs [here](docs/getting-started.md).

Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
