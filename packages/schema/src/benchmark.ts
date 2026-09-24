import { z } from 'zod';
import { ELEMENTS, MAIN_STATS_BY_SLOT } from './site-data';

const MAX_CONSTELLATION = 6;
const MAX_REFINEMENT = 5;
const MAX_TALENT_LEVEL = 15;

const nonEmptyText = z.string().trim().min(1);

// Notas são exceção: basta um idioma, o site mostra o outro com o selo "original em X"
export const localizedNotesSchema = z
  .strictObject({ pt: nonEmptyText.optional(), en: nonEmptyText.optional() })
  .refine((notes) => notes.pt !== undefined || notes.en !== undefined, {
    message: 'notes precisa de pelo menos um idioma (pt ou en)',
  });

const refinementSchema = z.int().min(1).max(MAX_REFINEMENT);

const weaponSchema = z.strictObject({ name: nonEmptyText, refinement: refinementSchema });

const artifactSetSchema = z.strictObject({
  name: nonEmptyText,
  pieces: z.union([z.literal(2), z.literal(4)]),
});

const talentLevel = z.int().min(1).max(MAX_TALENT_LEVEL);

// Atributos finais da ficha do personagem; taxas em porcentagem (ex.: critRate 65.4)
const statsSchema = z.strictObject({
  hp: z.number().positive().optional(),
  atk: z.number().positive().optional(),
  def: z.number().positive().optional(),
  elementalMastery: z.number().nonnegative().optional(),
  energyRecharge: z.number().positive().optional(),
  critRate: z.number().nonnegative().optional(),
  critDamage: z.number().nonnegative().optional(),
});

// Principais de relógio, cálice e tiara, como vieram na medição
const mainStatsSchema = z.strictObject({
  sands: z.enum(MAIN_STATS_BY_SLOT.sands),
  goblet: z.enum(MAIN_STATS_BY_SLOT.goblet),
  circlet: z.enum(MAIN_STATS_BY_SLOT.circlet),
});

// Investimento e build de um membro; o DPS principal não repete o personagem, que vem do nome do arquivo
export const memberBuildSchema = z.strictObject({
  // Só para quem não tem elemento fixo (Viajante, Manequins): o elemento usado na build
  element: z.enum(ELEMENTS).exclude(['none']).optional(),
  constellation: z.int().min(0).max(MAX_CONSTELLATION),
  weapon: weaponSchema,
  sets: z.array(artifactSetSchema).min(1).max(2).optional(),
  talents: z.tuple([talentLevel, talentLevel, talentLevel]).optional(),
  mainStats: mainStatsSchema.optional(),
  stats: statsSchema.optional(),
});

// Fontes da comunidade às vezes omitem a arma dos suportes; quando informam a arma, informam o refinamento
export const supportMemberSchema = memberBuildSchema.extend({
  character: nonEmptyText,
  weapon: weaponSchema.optional(),
});

// Quem publicou o número e como mediu: o site só agrega, e a metodologia é responsabilidade da fonte
export const benchmarkRefSchema = z.strictObject({
  author: nonEmptyText,
  url: z.url({ protocol: /^https$/ }),
  tool: nonEmptyText.optional(),
  notes: localizedNotesSchema.optional(),
});

export const benchmarkSchema = z.strictObject({
  // DPS absoluto do time inteiro (soma dos 4), na metodologia descrita pela fonte
  teamDps: z.number().positive(),
  rotationTime: z.number().positive().optional(),
  patch: z.string().regex(/^\d+\.\d+$/, 'patch no formato "6.8"'),
  ref: benchmarkRefSchema,
  rotation: nonEmptyText.optional(),
  notes: localizedNotesSchema.optional(),
  obsolete: z.literal(true).optional(),
  main: memberBuildSchema,
  supports: z.tuple([supportMemberSchema, supportMemberSchema, supportMemberSchema]),
});

export const benchmarkFileSchema = z.array(benchmarkSchema).min(1);

export type BenchmarkRefInput = z.infer<typeof benchmarkRefSchema>;
export type LocalizedNotesInput = z.infer<typeof localizedNotesSchema>;
export type MemberBuildInput = z.infer<typeof memberBuildSchema>;
export type SupportMemberInput = z.infer<typeof supportMemberSchema>;
export type BenchmarkInput = z.infer<typeof benchmarkSchema>;
