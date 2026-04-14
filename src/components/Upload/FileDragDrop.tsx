import { AttachFile, UploadFile } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import {
  type ChangeEvent,
  type Dispatch,
  type DragEvent,
  forwardRef,
  type SetStateAction,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import muiTheme, { Theme } from '../../assets/themes/theme';
import type { DropFileUpload } from '../../types/DropFileUpload';
import type {
  CustomUploadValidator,
  CustomUploadValidatorReturn,
} from '../../utilities/uploadUtils';

interface FileDragDropProps {
  files: DropFileUpload[]; // is only set to non-empty after validation/transform
  setFiles: Dispatch<SetStateAction<DropFileUpload[]>>;
  validFormats: Record<string, string>;
  multiple?: boolean | undefined;
  customValidators?: CustomUploadValidator[] | undefined;
  fileTransform?: (f: File[]) => Promise<File[]>;
  disabled?: boolean;
}

const FileDragDrop = forwardRef<any, FileDragDropProps>(
  (
    { files, setFiles, validFormats, multiple = false, customValidators, fileTransform, disabled },
    ref,
  ) => {
    const { enqueueSnackbar } = useSnackbar();
    const fileInputRef = useRef<null | HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState<boolean>(false);
    // This holds user-uploaded files prior to transform
    // We need them in case validation rules change after file selection
    const [originalFiles, setOriginalFiles] = useState<File[]>([]);

    const textColour = disabled ? 'text.disabled' : 'primary';
    const iconColour = disabled ? 'disabled' : 'primary';

    const handleDrag = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) {
        return;
      }

      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) {
        return;
      }

      const uploadedFiles = Array.from(e.dataTransfer?.files ?? []);
      setOriginalFiles(uploadedFiles);
    };
    const onBrowseClick = () => {
      fileInputRef.current?.click();
    };

    const handleBrowseChange = async (e: ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const uploadedFiles = Array.from(e.target?.files ?? []);
      setOriginalFiles(uploadedFiles);
    };

    const clearFiles = useCallback(() => {
      setFiles([]);
      setOriginalFiles([]);
    }, [setFiles]);

    useImperativeHandle(ref, () => ({ clearFiles }));

    // Validate files and apply transform whenever new files are added, or validation criteria change
    useEffect(() => {
      const validateFilesAreOfType = {
        func: (_files: File[]) =>
          ({
            success:
              Object.entries(validFormats).length === 0 ||
              _files.every((f) => Object.keys(validFormats).some((ex) => f.name.endsWith(ex))),
            message: `All files must be of a valid format: ${Object.keys(validFormats).join(', ')}`,
          }) as CustomUploadValidatorReturn,
      } as CustomUploadValidator;

      const validateSingleFile = {
        func: (_files: File[]) =>
          ({
            success: _files.length === 1,
            message: 'Only one file can be selected',
          }) as CustomUploadValidatorReturn,
      } as CustomUploadValidator;

      const getBuiltInValidators = (): CustomUploadValidator[] => {
        const validators: CustomUploadValidator[] = [];
        if (!multiple) {
          validators.push(validateSingleFile);
        }
        if (Object.entries(validFormats).length > 0) {
          validators.push(validateFilesAreOfType);
        }
        return validators;
      };

      const validateAndTransformUpload = () => {
        const validators = customValidators ?? [];
        for (const validator of [...getBuiltInValidators(), ...validators]) {
          const validatorReturn = validator.func(originalFiles);
          if (!validatorReturn.success) {
            enqueueSnackbar(validatorReturn.message, { variant: 'error', autoHideDuration: 8000 });
            clearFiles();
            return;
          }
        }

        const transform = fileTransform ?? ((files: File[]) => Promise.resolve(files));

        // Apply transform to file list and fail validation if it fails
        // By default this is the trivial transform, no change to the file list
        transform(originalFiles)
          .then((transformedFiles) => {
            setFiles(transformedFiles.map((file) => ({ file }) as DropFileUpload));
          })
          .catch((e) => {
            enqueueSnackbar(`File processing failed: ${e.message}`, {
              variant: 'error',
              autoHideDuration: 8000,
            });
            clearFiles();
          });
      };

      if (originalFiles.length > 0) {
        validateAndTransformUpload();
      }
    }, [
      originalFiles,
      multiple,
      validFormats,
      customValidators,
      fileTransform,
      enqueueSnackbar,
      clearFiles,
      setFiles,
    ]);

    return (
      <>
        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: dragActive ? '' : Theme.PrimaryMainBackground,
            marginTop: 2,
            marginBottom: 2,
            height: '250px',
            border: dragActive ? 4 : 0,
            borderColor: Theme.PrimaryMainBackground,
            borderStyle: dragActive ? 'dashed' : 'solid',
            // biome-ignore lint/suspicious/noNonNullAssertedOptionalChain: historic
            transition: muiTheme.transitions?.create!(['background-color', 'border'], {
              duration: muiTheme.transitions.duration?.standard,
            }),
          }}
        >
          <Stack spacing={1} justifyContent="center" alignItems="center">
            {files.length === 0 ? (
              <>
                <UploadFile fontSize="large" color={iconColour} />
                <Typography variant="h5" color={textColour}>
                  {multiple ? 'Drag and drop files here' : 'Drag and drop file here'}
                </Typography>
                <Typography variant="subtitle1" color={textColour}>
                  or
                </Typography>
                <Button variant="outlined" component="label" disabled={disabled}>
                  Browse
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="input-file-upload"
                    onClick={onBrowseClick}
                    multiple={multiple}
                    onChange={handleBrowseChange}
                    accept={[
                      ...new Set(
                        Object.entries(validFormats)
                          .flat()
                          .filter((x) => x !== ''),
                      ),
                    ].join(',')}
                    hidden
                  />
                </Button>
                {Object.entries(validFormats).length > 0 && (
                  <Typography variant="subtitle2" color={textColour}>
                    Valid file types are: {Object.keys(validFormats).join(', ')}
                  </Typography>
                )}
              </>
            ) : (
              <>
                <AttachFile fontSize="large" color="primary" />
                <Typography variant="h5" color="primary">
                  {multiple ? 'Selected files:' : 'Selected file:'}
                </Typography>
                <>
                  {files.map((file) => (
                    <div key={file.file.name}>
                      <Typography variant="subtitle1">{file.file.name}</Typography>
                    </div>
                  ))}
                </>
                <Button variant="outlined" color="error" onClick={clearFiles}>
                  Clear
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </>
    );
  },
);

export default FileDragDrop;
