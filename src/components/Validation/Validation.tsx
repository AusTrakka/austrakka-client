import {ResponseMessage} from "../../types/apiResponse.interface";
import React from "react";
import {Alert, AlertColor, Stack, Typography} from "@mui/material";

interface ValidationProps {
  messages: ResponseMessage[],
  title: string,
  showTitle: boolean,
}

export default function Validation(props: ValidationProps) {
  const { messages, title, showTitle } = props;
  
  return (
    <>
      { showTitle ? (<Typography variant="h4" color="primary">{title}</Typography>) : (<></>)}
      <Stack direction="column" spacing={1}>
        {messages.map(
          (message: ResponseMessage, index: number) => (
            <Alert key={index} severity={message.ResponseType.toLowerCase() as AlertColor}>
              <strong>{message.ResponseType}</strong>
              {' '}
              -
              {' '}
              {message.ResponseMessage}
            </Alert>
          ),
        )}
      </Stack>
    </>
  )
}