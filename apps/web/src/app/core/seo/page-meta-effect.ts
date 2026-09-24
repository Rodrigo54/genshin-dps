import { effect, inject } from '@angular/core';
import { PageMeta, type PageMetaContent } from './page-meta';

// Atualiza título e descrição sempre que o conteúdo (idioma ou dados da página) mudar.
// `undefined` enquanto os dados da página ainda carregam.
export function syncPageMeta(content: () => PageMetaContent | undefined): void {
  const pageMeta = inject(PageMeta);
  effect(() => {
    const current = content();
    if (current) pageMeta.set(current);
  });
}
