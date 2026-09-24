import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DataValidationError } from './build-site-data';
import { loadBenchmarkFiles, loadCatalogOverrides } from './load-data';

const validYaml = `
- teamDps: 252000
  rotationTime: 19.37
  patch: "6.8"
  ref: { author: April, url: https://example.com/mavuika }
  main: { constellation: 0, weapon: { name: A Thousand Blazing Suns, refinement: 1 } }
  supports:
    - { character: Citlali, constellation: 0, weapon: { name: Favonius Codex, refinement: 5 } }
    - { character: Bennett, constellation: 6, weapon: { name: Wolf-Fang, refinement: 5 } }
    - { character: Xilonen, constellation: 0, weapon: { name: Favonius Sword, refinement: 5 } }
`;

describe('load-data', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'genshin-dps-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('lê um arquivo por DPS principal, usando o nome do arquivo como id', async () => {
    await Bun.write(join(directory, 'mavuika.yaml'), validYaml);
    const [file] = await loadBenchmarkFiles(directory);
    expect(file!.mainCharacterId).toBe('mavuika');
    expect(file!.benchmarks[0]!.teamDps).toBe(252000);
  });

  it('aponta o arquivo e o campo inválido', async () => {
    await Bun.write(join(directory, 'mavuika.yaml'), validYaml.replace('patch: "6.8"', 'patch: "seis"'));
    const error = await loadBenchmarkFiles(directory).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(DataValidationError);
    expect((error as DataValidationError).message).toContain('data/benchmarks/mavuika.yaml');
    expect((error as DataValidationError).message).toContain('patch');
  });

  it('aceita arquivo de overrides vazio', async () => {
    const path = join(directory, 'catalog-overrides.yaml');
    await Bun.write(path, '');
    expect((await loadCatalogOverrides(path)).characters).toEqual([]);
  });
});
