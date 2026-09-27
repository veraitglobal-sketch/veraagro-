import { imageUriToJpegDataUrl, assertDataUrlWithinSize } from './image-data-url';

export async function prepareHandoverPhotos(uris: string[]): Promise<string[]> {
  return Promise.all(uris.map(async (uri) => {
    const data = uri.startsWith('data:image/') ? uri : await imageUriToJpegDataUrl(uri);
    assertDataUrlWithinSize(data, 1_800_000);
    return data;
  }));
}
