import { ArrowDropDown, ArrowDropUp, Sort } from '@mui/icons-material';

const sortIcon = (options: any) => {
  const icon = (
    <div className="custom-icon-container">
      {options.sorted ? (
        // biome-ignore lint/style/noNestedTernary: historic
        options.sortOrder < 0 ? (
          <ArrowDropDown fontSize="small" color="success" />
        ) : (
          <ArrowDropUp fontSize="small" color="success" />
        )
      ) : (
        <Sort fontSize="small" color="action" />
      )}
    </div>
  );
  return icon;
};

export default sortIcon;
