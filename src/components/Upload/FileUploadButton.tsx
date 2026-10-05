import { AttachFile } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { type ChangeEvent, useCallback, useEffect, useRef } from 'react';
import {
  type CustomUploadValidator,
  validateFileSizeLimit,
  validateFilesAreOfType,
  validateSingleFile,
} from './fileUploadValidators';

interface FileUploadButtonProps {
  onChange: (files: File[]) => void;
  validFormats?: Record<string, string>;
  multiple?: boolean;
  customValidators?: CustomUploadValidator[];
  maxFileSize?: number;
  disabled?: boolean;
  sx?: FileUploadButtonSx;
}

interface FileUploadButtonSx {
  size?: 'small' | 'medium' | 'large';
}

// more classic style upload component
export default function FileUploadButton({
  onChange,
  validFormats,
  multiple,
  customValidators,
  maxFileSize,
  disabled,
  sx,
}: FileUploadButtonProps) {
  const { enqueueSnackbar } = useSnackbar();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validators = useCallback(() => {
    const validators: CustomUploadValidator[] = [];
    if (!multiple) {
      // todo: I'm beginning to question how possible this is given it's enforced when defining multiple=false
      validators.push(validateSingleFile);
    }
    if (validFormats && Object.entries(validFormats).length > 0) {
      validators.push(validateFilesAreOfType);
    }
    if (maxFileSize) {
      validators.push(validateFileSizeLimit);
    }
    return validators;
  }, [multiple, maxFileSize, validFormats]);

  const handleOnBrowse = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const uploadedFiles = Array.from(e.target?.files ?? []);

      // Validate
      for (const validator of [...validators(), ...(customValidators ?? [])]) {
        const validatorReturn = validator.func(
          uploadedFiles,
          Object.keys(validFormats ?? {}),
          maxFileSize,
        );
        if (!validatorReturn.success) {
          enqueueSnackbar(validatorReturn.message, { variant: 'error', autoHideDuration: 8000 });
          return;
        }
      }

      onChange(uploadedFiles);
    },
    [customValidators, enqueueSnackbar, maxFileSize, onChange, validFormats, validators],
  );

  useEffect(() => {}, []);

  return (
    <Box display={'flex'} flexDirection={'row'} gap={1}>
      <Button variant="outlined" component="label" disabled={disabled} size={sx?.size ?? 'small'}>
        <AttachFile fontSize={sx?.size ?? 'small'} color="primary" />
        <Typography variant="body2" fontSize="1rem" sx={{ textTransform: 'none', marginLeft: 1 }}>
          Browse
        </Typography>
        <input
          ref={inputRef}
          type="file"
          id="input-file-upload"
          onClick={() => inputRef.current?.click()}
          multiple={multiple}
          onChange={handleOnBrowse}
          accept={[
            ...new Set(
              Object.entries(validFormats ?? {})
                .flat()
                .filter((x) => x !== ''),
            ),
          ].join(',')}
          hidden
        />
      </Button>
    </Box>
  );
}
