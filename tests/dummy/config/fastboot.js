// https://github.com/ember-fastboot/ember-cli-fastboot#fastboot-configuration

module.exports = function () {
  return {
    buildSandboxGlobals(defaultGlobals) {
      return Object.assign({}, defaultGlobals, {
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        fetch,
        AbortController,
      });
    },
  };
};
