import { z } from 'zod';
import { iconSchema, localizedNameSchema } from './catalog-overrides';
import { CHARACTER_LEVELS, ELEMENTS } from './site-data';

// data/characters/<id>.yaml: gerado por `bun run characters` a partir das tabelas do jogo, nunca editado à mão.
// É a fonte do catálogo de personagens; o nome do arquivo é o id.

const levelSchema = z.union(CHARACTER_LEVELS.map((level) => z.literal(level)));

// Status base no nível, depois da última ascensão; o atributo de ascensão já em porcentagem quando isPercent
const statsAtLevelSchema = z.strictObject({
  level: levelSchema,
  hp: z.number().positive(),
  atk: z.number().positive(),
  def: z.number().positive(),
  ascensionStat: z.number().nonnegative(),
});

// Textos da aba Perfil do jogo, no estado depois da revelação da história quando o personagem tem um
const profileSchema = z.strictObject({
  // Viajante e Manequins não têm título
  title: localizedNameSchema.optional(),
  constellation: localizedNameSchema,
  // "Visão", "Gnosis", "Eixo Estelar", "Disco Lunar"…
  visionLabel: localizedNameSchema,
  // Opcional porque o jogo pode deixar vazia; a da Viajante ("Melhor amigo de Paimon") é nossa
  affiliation: localizedNameSchema.optional(),
  description: localizedNameSchema,
});

export const characterFileSchema = z.strictObject({
  name: localizedNameSchema,
  rarity: z.union([z.literal(4), z.literal(5)]),
  element: z.enum(ELEMENTS),
  icon: iconSchema,
  weaponType: localizedNameSchema,
  region: localizedNameSchema,
  profile: profileSchema,
  ascensionStat: z.strictObject({ name: localizedNameSchema, isPercent: z.boolean() }),
  stats: z
    .array(statsAtLevelSchema)
    .refine((stats) => stats.map(({ level }) => level).join() === CHARACTER_LEVELS.join(), {
      message: `stats precisa dos níveis ${CHARACTER_LEVELS.join(', ')}, nessa ordem`,
    }),
});

export type CharacterFile = z.infer<typeof characterFileSchema>;
