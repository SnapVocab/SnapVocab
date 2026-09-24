/**
 * PUT a local file to a presigned storage URL.
 *
 * Uses fetch rather than the axios client: the URL points straight at storage
 * and must not carry our Bearer token, and the signature covers Content-Type,
 * which therefore has to match exactly what the URL was signed for.
 */
export async function putFileToStorage(uploadUrl: string, uri: string, contentType: string) {
  let response: Response;
  try {
    const file = await (await fetch(uri)).blob();
    response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    });
  }
  catch (error) {
    throw new UploadFailedError(String(error));
  }
  if (!response.ok)
    throw new UploadFailedError(`Storage responded ${response.status}`);
}

export class UploadFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadFailedError';
  }
}
