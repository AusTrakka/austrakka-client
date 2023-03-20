import React, { useState, memo } from 'react';
import { Select, MenuItem, Box, FormControl, InputLabel, Button, TextField, IconButton, ListItem, List, ListItemText, Chip } from "@mui/material";
import { MRT_ColumnDef } from 'material-react-table';
import { AddBox, IndeterminateCheckBox, Delete, FilterList, AddCircle, FilterNone } from '@mui/icons-material';

interface Filter {
    field: string,
    condition: string,
    value: string
}
const initialFilterState = {
    field: "",
    condition: "",
    value: ""
}

interface QueryBuilderProps {
    isOpen: boolean,
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
    queryString: string,
    setQueryString: React.Dispatch<React.SetStateAction<string>>,
    fieldList: MRT_ColumnDef<{}>[], //Get field listfrom columns rendered in the table
}

const QueryBuilder = (props: QueryBuilderProps) => {
    const {isOpen, setIsOpen, queryString, setQueryString, fieldList} = props
    const [filterList, setFilterList] = useState<Filter[]>([])
    const [newFilter, setNewFilter] = useState(initialFilterState)

    const conditions = [
        { key: "==", value: "==", icon: <>{"="}</> },
        { key: "!==", value: "!==", icon: <>{"!="}</> },
        { key: ">", value: ">", icon: <>{">"}</> },
        { key: "<", value: "<", icon: <>{"<"}</> },
        { key: ">=", value: ">=", icon: <>{">="}</> },
        { key: "<=", value: "<=", icon: <>{"<="}</> },
    ]
    // Filter change handlers
    const handleFilterChange = (event :any) => {
        setNewFilter({
            ...newFilter,
            [event.target.name]: event.target.value as string
        });
    }
    //Filter adding/deleting
    const handleFilterAdd = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // 1. Append state of newFilter to filterList if and only if field, condition and value are not empty (also show valdiation)
        const isEmpty = Object.values(newFilter).some(x => x === null || x === '');
        if (!isEmpty) {
            setFilterList(filterList => [...filterList, newFilter]);
            // 2. Refresh state of newFilter to empty 
            setNewFilter(initialFilterState)
        }
    }
    const handleFilterDelete = (filter: object, index: number) => {
        setFilterList(oldList => {
            return oldList.filter(filterEntry => filterEntry !== filter)
          })
    }
    const clearFilters = () => {
        console.log("clear all filters")
    }
    return (
        <>   
            <Box sx={{boxShadow: 1, borderRadius: 1, padding: 1, marginBottom: 2 }}>
                <div >
                    <Button onClick={() => setIsOpen(!isOpen)} sx={{textTransform: "none", fontWeight: "bold"}}>
                        {isOpen ? <IndeterminateCheckBox/>:<AddBox/>} Table filters
                    </Button>
                    { isOpen ? 
                        <> 
                        <br />
                        <form onSubmit={(event) => handleFilterAdd(event)}>
                            <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
                                <InputLabel id="field-simple-select-label">Field</InputLabel>
                                <Select
                                    labelId="field-simple-select-label"
                                    id="field-simple-select-label"
                                    label="Field"
                                    name="field"
                                    value={newFilter.field}
                                    onChange={handleFilterChange}
                                >
                                {fieldList.map(field =>
                                    <MenuItem key={field.accessorKey} value={field.header}>
                                        {field.header}
                                    </MenuItem>
                                )};
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
                                <InputLabel id="condition-simple-select-label">Condition</InputLabel>
                                <Select
                                    labelId="condition-simple-select-label"
                                    id="condition-simple-select"
                                    label="Condition"
                                    name="condition"
                                    value={newFilter.condition}
                                    onChange={handleFilterChange}
                                >
                                {conditions.map(condition =>
                                    <MenuItem key={condition.key} value={condition.value}>
                                        {condition.icon}
                                    </MenuItem>
                                )};
                                </Select>
                            </FormControl>
                            <FormControl sx={{ m: 1, minWidth: 120 }}>
                                <TextField id="outlined-basic" label="Value" variant="outlined" name="value" value={newFilter.value} onChange={handleFilterChange} size="small" />
                            </FormControl>
                            <IconButton type="submit" ><AddCircle color="secondary" sx={{ p: 1 }}/></IconButton>
                            <br/>
                            {filterList.map((filter, index) =>
                                <Chip 
                                    key={index}
                                    //label={filter.field + " " + filter.condition + " " + filter.value}
                                    label = {<><b>{filter.field}</b> {filter.condition} <b>{filter.value}</b></>}
                                    onDelete={() => handleFilterDelete(filter, index)}
                                    sx={{ margin: 1 }}
                                />
                            )}
                            {/* <List dense={true}>
                                {filterList.map((filter, index) =>
                                    <ListItem
                                        key={index}
                                        secondaryAction={
                                            <IconButton aria-label="delete" onClick={() => handleFilterDelete(filter, index)}>
                                                <Delete />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemText>{filter.field} {filter.condition} {filter.value}</ListItemText>
                                    </ListItem>
                                )}
                            </List> */}
                            
                            {/* If filterList length isn't 0, display a clear all filters button */}
                        </form>
                        </>
                        : 
                        <>
                        </>
                    }
                </div>
            </Box>
        </>
    );
}
export default memo(QueryBuilder);