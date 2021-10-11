import * as fs from 'fs';

import { keys } from 'ts-transformer-keys';

async function buildFastBootWrappers(
  moduleName: string,
  fileName: string,
  apiKeys: string[],
): Promise<void> {
  const firestore = await import(moduleName);
  const apisToExport = Object.keys(firestore).filter((key) => {
    if (
      typeof firestore[key] === 'function'
      && apiKeys.includes(key)
      && key.charAt(0) === key.charAt(0).toLowerCase()
    ) {
      return true;
    }

    return false;
  });

  fs.writeFile(
    `./addon/firebase/${fileName}.ts`,
    `// DO NOT MODIFY. THIS IS AUTO GENERATED.
import {
  ${apisToExport.map((api) => `${api} as _${api}`).join(',\n  ')},
} from '${moduleName}';

${apisToExport.map((api) => `let ___${api} = _${api};`).join('\n')}

if (typeof FastBoot !== 'undefined') {
  const {
    ${apisToExport.map((api) => `${api}: __${api}`).join(',\n    ')},
  } = FastBoot.require('${moduleName}');

  ${apisToExport.map((api) => `___${api} = __${api};`).join('\n  ')}
}

${apisToExport.map((api) => `export const ${api} = ___${api};`).join('\n')}\n`,
    () => {
      // do nothing
    },
  );
}

buildFastBootWrappers('firebase/app', 'app', keys<typeof import('firebase/app')>());
buildFastBootWrappers('firebase/auth', 'auth', keys<typeof import('firebase/auth')>());
buildFastBootWrappers('firebase/firestore', 'firestore', keys<typeof import('firebase/firestore')>());
