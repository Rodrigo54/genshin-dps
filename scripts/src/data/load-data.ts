import { basename, join } from 'node:path';
import {
  benchmarkFileSchema,
  type CatalogOverrides,
  catalogOverridesSchema,
  type CharacterFile,
  characterFileSchema,
} from '@genshin-dps/schema';
import { parse } from 'yaml';
import { z } from 'zod';
import { type BenchmarkFile, DataValidationError } from './build-site-data';

const YAML_EXTENSION = '.yaml';

async function readYaml(path: string): Promise<unknown> {
  return parse(await Bun.file(path).text());
}

function describeZodError(path: string, error: z.ZodError): string {
  return `${path}\n${z.prettifyError(error)}`;
}

export async function loadCatalogOverrides(path: string): Promise<CatalogOverrides> {
  const result = catalogOverridesSchema.safeParse((await readYaml(path)) ?? {});
  if (!result.success) throw new DataValidationError([describeZodError(path, result.error)]);
  return result.data;
}

// Um arquivo por personagem, gerado por `bun run characters`: data/characters/<id>.yaml
export async function loadCharacterFiles(directory: string): Promise<Record<string, CharacterFile>> {
  const fileNames = (await Array.fromAsync(new Bun.Glob(`*${YAML_EXTENSION}`).scan(directory))).sort();
  const parsed = await Promise.all(
    fileNames.map(async (fileName) => ({
      id: basename(fileName, YAML_EXTENSION),
      relativePath: `data/characters/${fileName}`,
      result: characterFileSchema.safeParse(await readYaml(join(directory, fileName))),
    })),
  );
  const issues = parsed.flatMap(({ relativePath, result }) =>
    result.success ? [] : [describeZodError(relativePath, result.error)],
  );
  if (issues.length > 0) throw new DataValidationError(issues);
  return Object.fromEntries(parsed.flatMap(({ id, result }) => (result.success ? [[id, result.data]] : [])));
}

// Cada arquivo agrupa os benchmarks de um DPS principal: data/benchmarks/<id-do-personagem>.yaml
export async function loadBenchmarkFiles(directory: string): Promise<BenchmarkFile[]> {
  const fileNames = await Array.fromAsync(new Bun.Glob(`*${YAML_EXTENSION}`).scan(directory));
  const parsed = await Promise.all(
    fileNames.sort().map(async (fileName) => {
      const path = join(directory, fileName);
      const relativePath = `data/benchmarks/${fileName}`;
      return { fileName, relativePath, result: benchmarkFileSchema.safeParse(await readYaml(path)) };
    }),
  );

  const issues = parsed.flatMap(({ relativePath, result }) =>
    result.success ? [] : [describeZodError(relativePath, result.error)],
  );
  if (issues.length > 0) throw new DataValidationError(issues);

  return parsed.flatMap(({ fileName, relativePath, result }) =>
    result.success
      ? [{ mainCharacterId: basename(fileName, YAML_EXTENSION), path: relativePath, benchmarks: result.data }]
      : [],
  );
}
