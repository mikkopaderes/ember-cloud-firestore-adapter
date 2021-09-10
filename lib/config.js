/* eslint-disable */

const Plugin = require('broccoli-plugin');
const fs = require('fs');
const path = require('path');

module.exports = class Config extends Plugin {
  /**
   * @override
   */
  constructor(inputNodes, option) {
    super(inputNodes, option);

    this.option = option;
  }

  /**
   * @override
   */
  build() {
    let module = '';

    module += `export const firebaseVersion = '${this.option.firebaseVersion || '9.0.1'}';\n`;
    module += `export const firebaseConfig = ${JSON.stringify(this.option.firebaseConfig)};\n`;

    fs.writeFileSync(path.join(this.outputPath, 'config.js'), module);
  }
};
