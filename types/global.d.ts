// Types for compiled templates
declare module 'ember-cloud-firestore-adapter/templates/*' {
  import { TemplateFactory } from 'htmlbars-inline-precompile';
  const tmpl: TemplateFactory;
  export default tmpl;
}

declare const FastBoot: { require(moduleName: string): any } | undefined;
