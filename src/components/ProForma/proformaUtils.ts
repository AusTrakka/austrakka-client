import { getProFormaDownload } from '../../utilities/resourceUtils';

export const handleProformaDownload = async (
  dAbbrev: string,
  version : number | null,
  token: string,
) => {
  try {
    const { blob, suggestedFilename } = await getProFormaDownload(dAbbrev, version, token);

    // Create a URL for the Blob object
    const blobUrl = URL.createObjectURL(blob);

    // Create a temporary link element to trigger the download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = suggestedFilename;
    link.click();

    // Clean up the URL and remove the link
    URL.revokeObjectURL(blobUrl);
    link.remove();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error:', error);
  }
};
