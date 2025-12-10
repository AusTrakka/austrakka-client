import React from 'react';

import pdfIcon from '../../assets/icons/filetypes/pdf.svg';
import wordIcon from '../../assets/icons/filetypes/doc.svg';
import excelIcon from '../../assets/icons/filetypes/excel.svg';
import fileIcon from '../../assets/icons/filetypes/file.svg';
import csvIcon from '../../assets/icons/filetypes/csv.svg';
import htmlIcon from '../../assets/icons/filetypes/html.svg';

export const fileIcons = {
  pdf: pdfIcon,
  doc: wordIcon,
  docx: wordIcon,
  csv: csvIcon,
  xls: excelIcon,
  xlsx: excelIcon,
  html: htmlIcon,
  default: fileIcon,
} as const;

export type FileExtension = keyof typeof fileIcons;

export function getFileIcon(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() as FileExtension | undefined;
  return fileIcons[extension ?? 'default'] ?? fileIcons.default;
}

interface FileIconProps {
  filename: string;
  size?: number;
  className?: string;
}

export function FileIcon({ filename, size = 18, className }: FileIconProps) {
  const icon = getFileIcon(filename);

  return (
    <img
      src={icon}
      alt="fileIcon"
      width={size}
      height={size}
      className={className}
    />
  );
}
