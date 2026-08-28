import type React from 'react';
import type { Organisation, ProjectOrganisationsPatch } from '../../../types/dtos';
import { Paper, Stack, Table, TableBody, TableContainer, Typography } from '@mui/material';
import { ResponseType } from '../../../constants/responseType';
import {
    addProjectOrganisations,
    getOrganisations,
    getProjectOrganisations,
    removeProjectOrganisations
} from '../../../utilities/resourceUtils';
import { useApi } from '../../../app/ApiContext';
import { useCallback, useEffect, useMemo, useState } from 'react';
import EditButtons from '../../Users/EditButtons';
import OrganisationList from './OrganisationList';
import { DataTable, DataTableFilterMeta, type DataTableFilterMetaData } from 'primereact/datatable';
import SearchInput from '../../TableComponents/SearchInput';
import { FilterMatchMode, FilterService } from 'primereact/api';
import sortIcon from '../../TableComponents/SortIcon';
import { Column } from 'primereact/column';
import { marginTop } from 'html2canvas/dist/types/css/property-descriptors/margin';


interface ProjectOrgsSectionProps {
    projectAbbrev: string | undefined;
    editable: boolean; // todo: verify if needed
    onSaveResult: (result: boolean) => void; // todo: investigate behaviour
}

export default function ProjectOrgsPropertiesSection({ projectAbbrev, editable, onSaveResult }: ProjectOrgsSectionProps): React.JSX.Element {
    // Editing state
    const { token } = useApi();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Data Table
    const [filter, setFilter] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })

    const columns = [
        {
            field: 'abbreviation',
            header: "Abbrev",
            body: ''
        },
        // {
        //     field: 'name',
        //     header: "Name",
        //     body: ''
        // },
        {
            field: 'state',
            header: "State",
            body: ''
        },
        {
            field: 'country',
            header: "Country",
            body: ''
        }
    ]

    // Read-only state
    const [orgs, setOrgs] = useState<Organisation[]>([]);
    const [projectOrgs, setProjectOrgs] = useState<Organisation[]>([]);

    // Data state
    // const [orgsToRemove, setOrgsToRemove] = useState<Organisation[]>([]);
    // const [orgsToAdd, setOrgsToAdd] = useState<Organisation[]>([]);

    const [pendingOrgs, setPendingOrgs] = useState<Organisation[]>([]);

    // Memos
    // const availableOrgs = useMemo(() => {
    //     const assignedOrgs = new Set([
    //         ...projectOrgs.map(o => o.abbreviation),
    //         ...orgsToAdd.map(o => o.abbreviation)
    //     ])
    //     return orgs.filter(o => !assignedOrgs.has(o.abbreviation));
    // }, [orgs, projectOrgs, orgsToAdd])
    //
    // const hasEdits = useMemo(() => {
    //     const modifiedOrgs = new Set([
    //         ...orgsToRemove.map(o => o.abbreviation),
    //         ...orgsToAdd.map(o => o.abbreviation)
    //     ])
    //     return modifiedOrgs.size > 0;
    // }, [orgsToAdd, orgsToRemove])

    const orgsToAdd = useMemo(() =>
            pendingOrgs.filter(o => !projectOrgs.find(p => p.abbreviation === o.abbreviation)),
        [pendingOrgs, projectOrgs]
    );

    const orgsToRemove = useMemo(() =>
            projectOrgs.filter(o => !pendingOrgs.find(p => p.abbreviation === o.abbreviation)),
        [pendingOrgs, projectOrgs]
    );

    const fetchProjectOrganisations = useCallback(async () => {

        if (!projectAbbrev) {
            // todo: set error / error message
            return;
        }

        const projOrgRes = await getProjectOrganisations(projectAbbrev, token);

        if (projOrgRes.type === ResponseType.Error) {
            setProjectOrgs([]);
            setIsError(true);
            setIsLoading(false);
            setErrorMessage(projOrgRes.message);
            return;
        }

        setProjectOrgs(projOrgRes.data || []);
        setIsLoading(false);
        setIsError(false);
    }, [token, projectAbbrev]);

    const fetchOrganisations = useCallback(async () => {
        const orgRes = await getOrganisations(false, token);

        if (orgRes.type === ResponseType.Error) {
            setOrgs([]);
            setIsError(true);
            setIsLoading(false);
            setErrorMessage(orgRes.message);
            return;
        }

        setOrgs(orgRes.data || []);
        setIsLoading(false);
        setIsError(false);
    }, [token]);

    const updateSelections = (selections: string[]) => {
        const next = orgs.filter(o => selections.includes(o.abbreviation));
        console.log("added orgs", next.filter(o => !pendingOrgs.find(p => p.abbreviation === o.abbreviation)).map(o => o.abbreviation));
        console.log("removed orgs", pendingOrgs.filter(o => !next.find(p => p.abbreviation === o.abbreviation)).map(o => o.abbreviation));
        console.log("pending length:", next.length);
        setPendingOrgs(next);
    };

    useEffect(() => {
        void fetchOrganisations();
    }, [fetchOrganisations]);

    useEffect(() => {
        void fetchProjectOrganisations();
    }, [fetchProjectOrganisations]);

    const handleSave = async () => {
        setIsSaving(true)
        // todo: unsure about setting is loading here?
        // setIsLoading(true);
        // todo: we want to cleverly handle adding and removing here, without needing to have
        //  two methods/functions. Aren't I swanky

        // todo: add error handling / warning to ui
        //  why do we assume a nullable abbrev is possible? is it for when people go to direct links?
        if (!projectAbbrev)
            return;

        if (orgsToRemove.length > 0) {
            const rmPatch: ProjectOrganisationsPatch = {
                organisationNames: orgsToRemove.map(o => o.abbreviation)
            }
            const rmRes = await removeProjectOrganisations(projectAbbrev, rmPatch, token);

            if (rmRes.type === ResponseType.Error) {
                setIsError(true);
                setErrorMessage(rmRes.message);
                setIsSaving(false);
                return;
            }
        }

        if (orgsToAdd.length > 0) {
            const addPatch: ProjectOrganisationsPatch = {
                organisationNames: orgsToAdd.map(o => o.abbreviation)
            }
            const addRes = await addProjectOrganisations(projectAbbrev, addPatch, token);

            if (addRes.type === ResponseType.Error) {
                setIsError(true);
                setErrorMessage(addRes.message);
                setIsSaving(false);
                return;
            }
        }
        setPendingOrgs([]);
        await fetchOrganisations();
        setIsSaving(false)
    };

    const handleCancel = () => {
        setPendingOrgs([])
        setIsEditing(false);
    };

    const header = () => {
        return (<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SearchInput
                value={(filter.global as DataTableFilterMetaData).value || ''}
                onChange={onGlobalFilterChange}
            />
            <div style={{ marginLeft: 'auto' }}>
                {isEditing ?
                    <OrganisationList available={orgs} selected={pendingOrgs} onChange={updateSelections}/> : null
                }
            </div>
        </div>)
    }

    // todo: taken almost verbatim from PlotList.tsx, should work to generify basic datatables into a shared component
    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const filters = { ...filter };
        (filters.global as DataTableFilterMetaData).value = value;
        setFilter(filters);
    };

    return (
        <Paper elevation={1} className="basic-project-info-table">
            {isLoading ? <Typography variant="body1" color="primary">Loading project organisations</Typography> :
                <div>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        style={{ padding: '10px' }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        {/*Participating Organisations*/}
                        Sharing
                    </Typography>
                    <EditButtons
                        editing={isEditing}
                        setEditing={setIsEditing}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        hasPendingChanges={pendingOrgs.length > 1}
                        canSee={() => editable}
                        onSaveLoading={isSaving}
                    />
                    </Stack>
                    <div style={{padding: '10px'}}>
                        {isError ?
                            <Typography variant="body1" color="error">Error fetching project organisations</Typography> :
                            <div>
                                {/*{ isEditing ?*/}
                                {/*    <OrganisationList available={orgs} selected={pendingOrgs} onChange={updateSelections}/> : null*/}
                                {/*}*/}
                                <DataTable
                                    value={projectOrgs}
                                    selectionMode="single"
                                    showGridlines
                                    resizableColumns
                                    scrollable
                                    filters={filter}
                                    header={header}
                                    globalFilterFields={columns.map((col) => col.field)}
                                    size={'small'}
                                    scrollHeight="calc(50vh - 300px)"
                                    columnResizeMode="expand"
                                    removableSort
                                    className="my-flexible-table"
                                    sortIcon={sortIcon}
                                    style={{marginTop: '10px'}}
                                >
                                    {columns.map((col) => (
                                        <Column
                                            key={col.field}
                                            field={col.field}
                                            header={col.header}
                                            body={col.body}
                                            resizeable
                                            style={{ minWidth: '150px' }}
                                            headerClassName="custom-title"
                                            className="flexible-column"
                                        />
                                    ))
                                    }
                                </DataTable>
                            </div>
                        }
                    </div>
                </div>
            }
        </Paper>
    )
}