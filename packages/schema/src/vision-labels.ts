import { z } from 'zod';
import { localizedNameSchema } from './catalog-overrides';

// data/vision-labels.yaml: rótulo do campo de elemento na aba Perfil do jogo ("Eixo Estelar", "Disco Lunar"…),
// por id de personagem. Quem não está no arquivo não tem rótulo próprio nos dados do jogo.
export const visionLabelsSchema = z.record(z.string().regex(/^[a-z0-9-]+$/, 'id de personagem'), localizedNameSchema);

export type VisionLabels = z.infer<typeof visionLabelsSchema>;
