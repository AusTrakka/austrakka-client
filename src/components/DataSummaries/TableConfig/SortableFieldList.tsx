import { move } from '@dnd-kit/helpers';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { DragIndicator, InfoOutlined, KeyboardArrowDown, QuestionMark } from '@mui/icons-material';
import { Autocomplete, Box, Checkbox, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { type KeyboardEvent, type MouseEvent, useMemo } from 'react';
import { Theme } from '../../../assets/themes/theme';
import { FieldTypes } from '../../../components/Fields/fieldsMeta';
import type { Field } from '../../../types/dtos';
import { FIELD_TYPE_COLOURS, FIELD_TYPE_ICONS } from '../../Fields/fieldsMeta';

const KNOWN_FIELD_TYPES = new Set<string>(Object.values(FieldTypes));
const FONT_SIZE_SMALL = 14;

const rowBoxSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  minWidth: '100%',
  flexShrink: 0,
  backgroundColor: Theme.PrimaryGrey200,
  borderRadius: 1,
  fontWeight: 'bold',
  typography: 'button',
  textTransform: 'none',
  cursor: 'pointer',
  paddingY: 0.5,
  paddingLeft: 1,
  paddingRight: 0.5,
  transition: 'background-color 0.15s ease',
  '&:hover': {
    backgroundColor: alpha(Theme.PrimaryGrey200, 0.7),
  },
} as const;

interface SortableFieldListProps {
  title?: string;
  fields: Field[];
  selectedFieldNames: string[];
  onChange: (nextSelectedFieldNames: string[]) => void;
  onOpenItemMenu?: (
    colName: string,
    event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>,
  ) => void;
  unavailableFields?: Set<string>;
  placeholder?: string;
}

function getFieldType(field?: Field): FieldTypes {
  if (!field) return FieldTypes.STRING;
  const raw = field.primitiveType ?? field.metaDataColumnTypeName;
  if (raw && KNOWN_FIELD_TYPES.has(raw)) {
    return raw as FieldTypes;
  }
  return FieldTypes.STRING;
}

// Field icon + type tooltip
function FieldTypeIndicator({ fieldType }: { fieldType: FieldTypes }) {
  const FieldIcon = FIELD_TYPE_ICONS[fieldType];

  if (!FieldIcon) {
    return (
      <Tooltip title="Unknown field type" arrow placement="left">
        <QuestionMark sx={{ fontSize: 16, color: Theme.PrimaryGrey500 }} />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={`Field type: ${fieldType}`} arrow placement="left">
      <FieldIcon
        sx={{
          fontSize: 16,
          color: FIELD_TYPE_COLOURS[fieldType] ?? Theme.PrimaryGrey500,
          '&:hover': { opacity: 0.6 },
          transition: 'opacity 0.15s ease',
        }}
      />
    </Tooltip>
  );
}

// Draggable sortable row
function SortableFieldRow({
  colName,
  index,
  fieldType,
  label,
  onOpenMenu,
}: {
  colName: string;
  index: number;
  fieldType: FieldTypes;
  label: string;
  onOpenMenu?: (col: string, e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({ id: colName, index });

  return (
    <Box
      ref={ref}
      sx={{ ...rowBoxSx, opacity: isDragging ? 0.3 : 1, transition: 'opacity 0.15s ease' }}
      role="button"
      tabIndex={0}
      onClick={(e) => onOpenMenu?.(colName, e)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenMenu?.(colName, e);
        }
      }}
    >
      <DragIndicator
        ref={handleRef}
        fontSize="small"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        sx={{
          mr: 0.5,
          color: Theme.PrimaryGrey500,
          cursor: 'grab',
          ':hover': { color: Theme.PrimaryGrey700 },
        }}
      />
      <FieldTypeIndicator fieldType={fieldType} />
      <Box sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </Box>
      <KeyboardArrowDown fontSize="small" sx={{ color: Theme.PrimaryGrey500 }} />
    </Box>
  );
}

export function SortableFieldList({
  title,
  fields,
  selectedFieldNames,
  onChange,
  onOpenItemMenu,
  unavailableFields = new Set(),
  placeholder = 'Select fields',
}: SortableFieldListProps) {
  const fieldMap = useMemo(() => {
    const map = new Map<string, Field>();
    for (const f of fields) {
      map.set(f.columnName, f);
    }
    return map;
  }, [fields]);

  const allColumnNames = useMemo(() => fields.map((f) => f.columnName), [fields]);

  return (
    <Box>
      {title && (
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold' }}>
          {title}
        </Typography>
      )}
      <Autocomplete
        multiple
        size="small"
        renderTags={() => null}
        disableCloseOnSelect
        options={allColumnNames}
        value={selectedFieldNames}
        onChange={(_, newValues) => onChange(newValues)}
        getOptionDisabled={(colName) => unavailableFields.has(colName)}
        getOptionLabel={(colName) => fieldMap.get(colName)?.headerName ?? colName}
        renderOption={(props, colName, { selected }) => {
          const { key, ...otherProps } = props;
          const isUnavailable = unavailableFields.has(colName);
          const label = fieldMap.get(colName)?.headerName ?? colName;

          return (
            <li key={key} {...otherProps}>
              <Checkbox
                checked={selected}
                sx={{ '& .MuiSvgIcon-root': { fontSize: FONT_SIZE_SMALL } }}
              />
              <Box component="span" sx={{ flexGrow: 1 }}>
                {label}
              </Box>
              {isUnavailable && (
                <Tooltip title="Unavailable for summary generation" arrow>
                  <InfoOutlined fontSize="small" color="action" />
                </Tooltip>
              )}
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={placeholder}
            sx={{
              mb: selectedFieldNames.length > 0 ? 1.5 : 0,
              fontSize: FONT_SIZE_SMALL,
              '& .MuiInputBase-input': { fontSize: FONT_SIZE_SMALL },
              '& .MuiInputLabel-root': { fontSize: FONT_SIZE_SMALL },
            }}
          />
        )}
      />

      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) return;
          onChange(move(selectedFieldNames, event));
        }}
      >
        {selectedFieldNames.length > 0 && (
          <Stack spacing={1}>
            {selectedFieldNames.map((colName, index) => {
              const fieldObj = fieldMap.get(colName);
              const label = fieldObj?.headerName ?? colName;
              const fieldType = getFieldType(fieldObj);

              return (
                <SortableFieldRow
                  key={colName}
                  colName={colName}
                  index={index}
                  fieldType={fieldType}
                  label={label}
                  onOpenMenu={onOpenItemMenu}
                />
              );
            })}
          </Stack>
        )}

        <DragOverlay>
          {(source) => {
            const colName = String(source.id);
            const fieldObj = fieldMap.get(colName);
            const label = fieldObj?.headerName ?? colName;
            const fieldType = getFieldType(fieldObj);

            return (
              <Box sx={{ ...rowBoxSx, width: '100%' }}>
                <DragIndicator fontSize="small" sx={{ mr: 0.5, color: Theme.PrimaryGrey700 }} />
                <FieldTypeIndicator fieldType={fieldType} />
                <Box
                  sx={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Box>
              </Box>
            );
          }}
        </DragOverlay>
      </DragDropProvider>
    </Box>
  );
}
