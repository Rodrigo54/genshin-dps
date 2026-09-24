const DIACRITICS = /[̀-ͯ]/g;
const NON_ALPHANUMERIC_RUN = /[^a-z0-9]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;

// "Kaedehara Kazuha" → "kaedehara-kazuha"; usado em ids e rotas
export function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_RUN, '-')
    .replace(EDGE_HYPHENS, '');
}
