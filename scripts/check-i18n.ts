import { join } from 'node:path';
import { LOCALES } from '@genshin-dps/schema';
import { findMissingKeys, findRenderedKeys, flattenKeys, type TranslationTree } from './src/i18n/translation-keys';
import { PATHS } from './src/paths';
import { reportFailure } from './src/report';

class UntranslatedKeysError extends Error {
  constructor(issues: string[]) {
    super(`Traduções com problema:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`);
    this.name = 'UntranslatedKeysError';
  }
}

async function readTranslations(): Promise<Map<string, TranslationTree>> {
  const entries = await Promise.all(
    LOCALES.map(async (locale) => [locale, await Bun.file(join(PATHS.translations, `${locale}.json`)).json()] as const),
  );
  return new Map(entries);
}

function findLocaleGaps(translations: Map<string, TranslationTree>): string[] {
  const allKeys = [...new Set([...translations.values()].flatMap((tree) => flattenKeys(tree)))];
  return [...translations].flatMap(([locale, tree]) =>
    findMissingKeys(allKeys, flattenKeys(tree)).map((key) => `${locale}.json não tem "${key}"`),
  );
}

async function findKeysInPrerenderedHtml(namespaces: string[]): Promise<string[]> {
  const pages = await Array.fromAsync(new Bun.Glob('**/*.html').scan(PATHS.prerenderedSite));
  const findings = await Promise.all(
    pages.map(async (page) => {
      const keys = findRenderedKeys(await Bun.file(join(PATHS.prerenderedSite, page)).text(), namespaces);
      return keys.map((key) => `${page} renderizou a chave "${key}"`);
    }),
  );
  return findings.flat();
}

// Roda depois do `ng build`: idiomas com as mesmas chaves e nenhum HTML com chave no lugar do texto
async function checkI18n(): Promise<void> {
  const translations = await readTranslations();
  const namespaces = Object.keys(translations.values().next().value ?? {});
  const issues = [...findLocaleGaps(translations), ...(await findKeysInPrerenderedHtml(namespaces))];
  if (issues.length > 0) throw new UntranslatedKeysError(issues);
  console.log(`i18n ok: ${LOCALES.join(', ')} com as mesmas chaves e nenhum HTML com chave sem tradução`);
}

await checkI18n().catch(reportFailure);
