import { z } from 'zod';
import { ELEMENTS } from './site-data';

const nonEmptyText = z.string().trim().min(1);

const localizedNameSchema = z.strictObject({ pt: nonEmptyText, en: nonEmptyText });

// Nome do arquivo do ícone no CDN da Enka (ex.: UI_AvatarIcon_Mavuika)
const iconSchema = z.string().regex(/^UI_[A-Za-z0-9_]+$/, 'ícone no formato UI_...');

const characterOverrideSchema = z.strictObject({
  name: localizedNameSchema,
  rarity: z.union([z.literal(4), z.literal(5)]),
  element: z.enum(ELEMENTS),
  icon: iconSchema,
});

const weaponOverrideSchema = z.strictObject({
  name: localizedNameSchema,
  rarity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  icon: iconSchema,
});

const artifactSetOverrideSchema = z.strictObject({
  name: localizedNameSchema,
});

// Apelido usado no YAML → nome canônico em inglês do catálogo
const aliasMapSchema = z.record(nonEmptyText, nonEmptyText);

export const catalogOverridesSchema = z.strictObject({
  aliases: z
    .strictObject({
      characters: aliasMapSchema.default({}),
      weapons: aliasMapSchema.default({}),
      artifactSets: aliasMapSchema.default({}),
    })
    .default({ characters: {}, weapons: {}, artifactSets: {} }),
  characters: z.array(characterOverrideSchema).default([]),
  weapons: z.array(weaponOverrideSchema).default([]),
  artifactSets: z.array(artifactSetOverrideSchema).default([]),
});

export type CatalogOverrides = z.infer<typeof catalogOverridesSchema>;
