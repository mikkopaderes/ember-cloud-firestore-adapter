import * as fs from 'fs';

import { keys } from 'ts-transformer-keys';

async function buildFastBootWrappers(
  moduleName: string,
  moduleExports: string[],
  outputFileName: string,
  moduleExportsToSkip: string[] = [],
): Promise<void> {
  const module = await import(moduleName);
  const outputExports = Object.keys(module).filter((key) => {
    if (
      typeof module[key] === 'function'
      && moduleExports.includes(key)
      && key.charAt(0) === key.charAt(0).toLowerCase()
      && !moduleExportsToSkip.includes(key)
    ) {
      return true;
    }

    return false;
  });

  fs.writeFile(
    `./addon/firebase/${outputFileName}.ts`,
    `/* eslint-disable max-len */
// DO NOT MODIFY. THIS IS AUTO GENERATED.
import {
  ${outputExports.map((api) => `${api} as _${api}`).join(',\n  ')},
} from '${moduleName}';

${outputExports.map((api) => `export function ${api}(...args: Parameters<typeof _${api}>): ReturnType<typeof _${api}> {
  if (typeof FastBoot === 'undefined') {
    return _${api}(...args);
  }

  const { ${api}: __${api} } = FastBoot.require('${moduleName}');

  return __${api}(...args);
}`).join('\n\n')}\n`,
    () => {
      // do nothing
    },
  );
}

buildFastBootWrappers('firebase/app', keys<typeof import('firebase/app')>(), 'app');
buildFastBootWrappers('firebase/auth', keys<typeof import('firebase/auth')>(), 'auth', [
  'debugErrorMap',
  'inMemoryPersistence',
  'prodErrorMap',
]);
buildFastBootWrappers('firebase/firestore', keys<typeof import('firebase/firestore')>(), 'firestore');
