import {ResponseMessage} from "../../types/apiResponse.interface";
import {
  Box, Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import React from "react";
import Validation from "./Validation";

interface ValidationModalProps {
  messages: ResponseMessage[],
  title: string,
  openModal: boolean,
  handleModalClose: ((event: {}, reason: 'backdropClick' | 'escapeKeyDown') => void)
}

export default function ValidationModal(props: ValidationModalProps) {
  const { 
    messages, 
    title, 
    openModal,
    handleModalClose,
  } = props;
  return (
    <>
      <Dialog
        open={openModal}
        onClose={handleModalClose}
      >
        <Box>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <Validation 
              messages={messages} 
              title={title}
              showTitle={false}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => handleModalClose({ undefined }, 'backdropClick')}
            >
              Close
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  )
}