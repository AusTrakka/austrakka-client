import React, { Dispatch, SetStateAction } from 'react';
import { Dialog, DialogTitle, DialogContent, Table, TableContainer, TableBody, TableRow, TableCell, TableHead, Paper } from '@mui/material';
import { MetaDataColumnMapping } from '../../types/dtos';

interface TableDialogProps {
  open: boolean;
  proformaDialog: MetaDataColumnMapping[];
  setOpen: Dispatch<SetStateAction<boolean>>;
  setProFormaDialog: Dispatch<SetStateAction<MetaDataColumnMapping[]>>;
  proformaTitle: string;
}

function TableDialog({
  open,
  proformaDialog,
  setOpen,
  setProFormaDialog,
  proformaTitle,
}: TableDialogProps) {
  const handleClose = () => {
    setProFormaDialog([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ color: '#OA3546', fontWeight: 'bold', paddingLeft: '40px' }}>
        {proformaTitle}
        {' '}
        ProForma Information
      </DialogTitle>
      <DialogContent sx={{ padding: '40px' }}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell
                  component="th"
                  scope="row"
                  style={{ backgroundColor: '#b0d997', fontWeight: 'bold' }}
                >
                  Name
                </TableCell>
                <TableCell
                  align="right"
                  style={{ backgroundColor: '#b0d997', fontWeight: 'bold' }}
                >
                  Required
                </TableCell>
                <TableCell
                  align="right"
                  style={{ backgroundColor: '#b0d997', fontWeight: 'bold' }}
                >
                  Type
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proformaDialog.map((row) => (
                <TableRow key={row.metaDataColumnName}>
                  <TableCell component="th" scope="row">
                    {row.metaDataColumnName}
                  </TableCell>
                  <TableCell align="right">{row.isRequired.toString()}</TableCell>
                  <TableCell align="right">{row.metaDataColumnPrimitiveType === null ? 'categorical' : row.metaDataColumnPrimitiveType}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
}

export default TableDialog;
