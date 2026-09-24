export interface TranslationTree {
  [key: string]: string | TranslationTree;
}

const EMBEDDED_CODE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;

export function flattenKeys(tree: TranslationTree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [path] : flattenKeys(value, path);
  });
}

export function findMissingKeys(referenceKeys: string[], keys: string[]): string[] {
  const available = new Set(keys);
  return referenceKeys.filter((key) => !available.has(key));
}

// Sem tradução, o Transloco renderiza a própria chave ("ranking.title"); procura esse formato
// no HTML, fora de <script>/<style>, onde ficam o estado transferido e o CSS
export function findRenderedKeys(html: string, namespaces: string[]): string[] {
  const keyPattern = new RegExp(String.raw`\b(?:${namespaces.join('|')})\.[A-Za-z0-9_.]*[A-Za-z0-9_]`, 'g');
  return [...new Set(html.replace(EMBEDDED_CODE, '').match(keyPattern) ?? [])];
}
