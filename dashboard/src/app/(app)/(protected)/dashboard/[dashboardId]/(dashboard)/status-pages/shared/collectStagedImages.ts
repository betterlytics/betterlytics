import { type StatusPageImagesInput } from '@/entities/analytics/statusPage/statusPage.entities';
import { type StagedImageChange } from './useStagedImage';
import { type StatusPageFormState } from './useStatusPageFormState';

async function changeToInput(change: StagedImageChange): Promise<Uint8Array | null | undefined> {
  if (change == null) return undefined; // unchanged
  if (change.kind === 'remove') return null;
  return new Uint8Array(await change.blob.arrayBuffer());
}

export async function collectStagedImages(
  form: Pick<StatusPageFormState, 'logo' | 'favicon'>,
): Promise<StatusPageImagesInput> {
  return {
    logo: await changeToInput(form.logo.change),
    favicon: await changeToInput(form.favicon.change),
  };
}
