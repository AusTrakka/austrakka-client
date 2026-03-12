export default function UploadSequencesHelp() {
  return (
    <>
      You can drag-and-drop a set of FASTQ or FASTA files into the file upload box, or click to
      select files.
      <br />
      <br />
      For FASTQ files and FASTA assembly files,, {import.meta.env.VITE_BRANDING_NAME} will attempt
      to determine the Seq_IDs from the filenames, and to pair the files into read 1 and read 2 file
      pairs if appropriate. {import.meta.env.VITE_BRANDING_NAME} will assume that the first part of
      the filename, up until the first underscore (_) is the Seq_ID.
      <br />
      <br />
      You can edit file pair assignments and Seq_IDs before submitting.
      <br />
      <br />
      For consensus FASTA files, you may include multiple samples in a single file, one contig per
      sequence record. The Seq_IDs must be the FASTA headers (contig names). For this data type, the
      filename will be ignored.
      <br />
      <br />
      If sequences already exist for a Seq_ID you are uploading to, by default,{' '}
      {import.meta.env.VITE_BRANDING_NAME} will skip the upload for that Seq_ID, and display an
      error. If you know that some of your sequence files are for samples which already have
      sequence data, you can select <code>Skip</code> to skip these files with no error displayed,
      or <code>Force</code> to overwrite the existing data. Note that only sequence data of the same
      type you are uploading (e.g. paired-end FASTQ) will be checked or overwritten.
      <br />
      <br />
      If you encounter any errors and need to upload only the files which did not successfully
      upload, you can retry the same upload with the <code>Skip</code> option selected.
    </>
  );
}
