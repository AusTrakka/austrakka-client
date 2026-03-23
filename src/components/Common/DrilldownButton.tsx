import { ArrowForward } from '@mui/icons-material';
import { Button, styled } from '@mui/material';

const CustomButton = styled(Button)({
  textTransform: 'none',
  padding: '0px',
  color: 'grey',
});

export default function DrilldownButton(props: any) {
  const { title, onClick } = props;
  return (
    <CustomButton endIcon={<ArrowForward />} onClick={onClick}>
      {title}
    </CustomButton>
  );
}
