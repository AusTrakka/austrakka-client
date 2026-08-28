import { Autocomplete, Box, Checkbox, TextField, Tooltip, Typography } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { Organisation } from '../../../types/dtos';
import { SyntheticEvent, useMemo } from 'react';


interface OrganisationListProps {
    available: Organisation[],
    selected: Organisation[], // Existing links & to add in one
    onChange: (selections: string[]) => void
}

export default function OrganisationList({available, selected, onChange}: OrganisationListProps) {

    const columnNames = useMemo(() => {
        const orgs = new Set([
            ...available.map(org => org.abbreviation),
            ...selected.map(org => org.abbreviation)
        ])
        return Array.from(orgs)
    }, [available, selected])

    // const getOrgName = (abbrev: string): string => {
    //
    //     const allOrgs = [...available, ...selected];
    //
    //     const res = allOrgs.find(o => o.abbreviation === abbrev)
    //     if (!res) {
    //         throw new Error(`Could not find Organisation with abbreviation: ${abbrev}`)
    //     }
    //     return res.name;
    // }

    return (
        <Box sx={{ width: 'fit-content', minWidth: '200px' }}>
            {/*<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold' }}>*/}
            {/*    Organisations*/}
            {/*</Typography>*/}
            <Autocomplete
                multiple
                size="small"
                renderTags={() => null}
                disableCloseOnSelect
                options={columnNames}
                value={selected.map(org => org.abbreviation)}
                onChange={(_, newValues) => onChange(newValues)}
                // getOptionDisabled={(colName) => !new Set([...available.map(org => org.abbreviation)]).has(colName)}
                getOptionLabel={(colName) => colName}
                slotProps={{
                    popper: {
                        placement: 'top-start',
                        modifiers: [{ name: 'flip', enabled: false }],
                    }
                }}
                renderOption={(props, colName, { selected }) => {
                    const { key, ...otherProps } = props;
                    // const isUnavailable = !new Set([...available.map(org => org.abbreviation)]).has(colName);
                    return (
                        <li key={key} {...otherProps}>
                            <Checkbox
                                checked={selected}
                                sx={{ '& .MuiSvgIcon-root': { fontSize: 12 } }}
                            />
                            <Box component="span" sx={{ flexGrow: 1 }}>
                                {colName}
                            </Box>
                            {/*{isUnavailable && (*/}
                            {/*    <Tooltip title="Unavailable for summary generation" arrow>*/}
                            {/*        <InfoOutlined fontSize="small" color="action" />*/}
                            {/*    </Tooltip>*/}
                            {/*)}*/}
                        </li>
                    );
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={"idk"}
                        sx={{
                            mb: selected.length > 0 ? 1.5 : 0,
                            fontSize: 12,
                            '& .MuiInputBase-input': { fontSize: 12 },
                            '& .MuiInputLabel-root': { fontSize: 12 },
                        }}
                    />
                )}
            />
        </Box>
    )


}