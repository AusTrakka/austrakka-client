import {
    Autocomplete,
    Box,
    Button,
    Chip, CircularProgress,
    Divider, MenuItem,
    Paper,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../app/ApiContext';
import type { Announcement, Member, Organisation, Project, UserList } from '../../types/dtos';
import {
    createAnnouncement,
    getOrganisations,
    getOrgMembers,
    getProjectList,
    getProjectMembers,
    getUserList
} from '../../utilities/resourceUtils';
import { ResponseType } from '../../constants/responseType';
import LoadingState from '../../constants/loadingState';
import { useSnackbar } from 'notistack';
import { Theme } from '../../assets/themes/theme';
import { Send } from '@mui/icons-material';

enum RecipientTypes {
    User = 'User',
    Organisation = 'Organisation',
    Project = 'Project',
}

interface Recipient {
    type: RecipientTypes,
    identifier: string,
    displayName: string,
}


const toUserRecipient = (user: UserList): Recipient => ({
    type: RecipientTypes.User,
    identifier: user.globalId,
    displayName: user.contactEmail,
});

const toOrganisationRecipient = (org: Organisation): Recipient => ({
    type: RecipientTypes.Organisation,
    identifier: org.globalId,
    displayName: org.abbreviation,
});

const toProjectRecipient = (project: Project): Recipient => ({
    type: RecipientTypes.Project,
    identifier: project.globalId,
    displayName: project.name,
});


function Announcements() {
    const { token, tokenLoading } = useApi();
    // const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    // const [isError, setIsError] = useState(false);

    // Objects to select users from
    const [organisations, setOrganisations] = useState<Organisation[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<UserList[]>([]);

    const [recipients, setRecipients] = useState<Recipient[]>([]);

    const [subject, setSubject] = useState<string | null>(null);
    const [body, setBody] = useState<string | null>(null);

    const [recipientMode, setRecipientMode] = useState<RecipientTypes>(RecipientTypes.User);
    const [pendingUser, setPendingUser] = useState<UserList | null>(null);
    const [pendingOrg, setPendingOrg] = useState<Organisation | null>(null);
    const [pendingProject, setPendingProject] = useState<Project | null>(null);

    const { enqueueSnackbar } = useSnackbar();

    const enableAddButton =
        (recipientMode === RecipientTypes.User && !!pendingUser) ||
        (recipientMode === RecipientTypes.Organisation && !!pendingOrg) ||
        (recipientMode === RecipientTypes.Project && !!pendingProject);

    // const enableSendButton = (!isError && recipients.length > 0 && !!body && !!subject);
    const enableSendButton = (recipients.length > 0 && !!body && !!subject);

    const filteredOrganisations = useMemo(() => {
        const orgRecipients = new Set(
            recipients
                .filter((x) => x.type === RecipientTypes.Organisation)
                .map((x) => x.identifier),
        );

        return organisations.filter((o) => !orgRecipients.has(o.globalId));
    }, [organisations, recipients]);

    const filteredUsers = useMemo(() => {
        const userRecipients = new Set(
            recipients
                .filter((x) => x.type === RecipientTypes.User)
                .map((x) => x.identifier),
        );

        return users.filter((u) => !userRecipients.has(u.globalId));
    }, [users, recipients]);

    const filteredProjects = useMemo(() => {
        const projectRecipients = new Set(
            recipients
                .filter((x) => x.type === RecipientTypes.Project)
                .map((x) => x.identifier),
        );

        return projects.filter((p) => !projectRecipients.has(p.globalId));
    }, [projects, recipients]);

    useEffect(() => {
        const isTokenReady =
            tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING;

        if (!isTokenReady) return;

        const fetchOrganisations = async () => {
            const orgRes = await getOrganisations(false, token);

            if (orgRes.status !== ResponseType.Success) {
                // setIsError(true);
                setOrganisations([]);
                // setErrorMessage(orgRes.message);
                enqueueSnackbar(orgRes.message, { variant: 'error', autoHideDuration: 8000 });
                return;
            }

            const organisations = orgRes.data;

            if (organisations === undefined || organisations.length === 0) {
                setOrganisations([]);
            } else {
                setOrganisations(organisations);
            }
        };

        const fetchUsers = async () => {
            const userRes = await getUserList(false, token)

            if (userRes.status !== ResponseType.Success) {
                // setIsError(true);
                setUsers([]);
                // setErrorMessage(userRes.message);
                enqueueSnackbar(userRes.message, { variant: 'error', autoHideDuration: 8000 });
                return;
            }

            const users = userRes.data as UserList[];

            if (users === undefined || users.length === 0) {
                setUsers([]);
            } else {
                setUsers(users.filter(x => !x.isAusTrakkaProcess));
            }
        }

        const fetchProjects = async () => {
            const projectRes = await getProjectList(token);

            if (projectRes.status !== ResponseType.Success) {
                // setIsError(true);
                setProjects([]);
                enqueueSnackbar(projectRes.message, { variant: 'error', autoHideDuration: 8000 });
                // setErrorMessage(projectRes.message);
                return;
            }

            const projects = projectRes.data;

            if (projects === undefined || projects.length === 0) {
                setProjects([]);
            } else {
                setProjects(projects);
            }
        }

        setIsLoading(true);

        void fetchOrganisations();
        void fetchUsers();
        void fetchProjects();

        setIsLoading(false);
    }, [token, tokenLoading, // setErrorMessage(userRes.message);
                enqueueSnackbar]);

    const handleAddRecipient = (recipient: Recipient) => {
        setRecipients((current) =>
            current.some(
                (r) => r.type === recipient.type && r.identifier === recipient.identifier,
            ) ? current : [...current, recipient],
        );
        setPendingOrg(null)
        setPendingUser(null)
        setPendingProject(null)
    };

    const handleRemoveRecipient = (recipient: Recipient) => {
        setRecipients((current) =>
            current.filter(
                (r) => !(r.type === recipient.type && r.identifier === recipient.identifier),
            ),
        );
    };

    const getOrganisationMembers = async (identifier: string) => {
        const res = await getOrgMembers(identifier, token);

        if (res.status === ResponseType.Error) {
            // setIsError(true);
            // setErrorMessage(res.message);
            enqueueSnackbar(res.message, { variant: 'error', autoHideDuration: 8000 });
            return;
        }
        return res.data as Member[];
    }

    const getProjMembers = async (identifier: string) => {
        const res = await getProjectMembers(identifier, token);

        if (res.status === ResponseType.Error) {
            // setIsError(true);
            // setErrorMessage(res.message);
            enqueueSnackbar(res.message, { variant: 'error', autoHideDuration: 8000 });
        }

        return res.data as Member[];
    }

    const handleSend = async () => {


        if (!subject) {
            // setErrorMessage("Subject is required");
            // setIsError(true)
            enqueueSnackbar("Subject is required", { variant: 'error', autoHideDuration: 8000 });
            return;
        }

        if (!body) {
            // setErrorMessage("Body is required");
            // setIsError(true)
            enqueueSnackbar("Body is required", { variant: 'error', autoHideDuration: 8000 });
            return;
        }

        try {
            setIsLoading(true);

            let finalisedRecipients: string[] = [];

            for (const recipient of recipients) {
                if (recipient.type === RecipientTypes.Organisation) {
                    const res = await getOrganisationMembers(recipient.identifier);
                    if (!res) {
                        // setIsError(true);
                        // setErrorMessage("Could not retrieve organisation members");
                        enqueueSnackbar("Failed to retrieve organisation members", { variant: 'error', autoHideDuration: 8000 });
                        return;
                    }
                    if (res.length === 0) {
                        // setIsError(true);
                        // setErrorMessage(`No organisation members found for ${recipient.displayName}`);
                        enqueueSnackbar(`No organisation members found for ${recipient.displayName}`, { variant: 'error', autoHideDuration: 8000 });
                        return;
                    }
                    finalisedRecipients = [... finalisedRecipients, ... res.map(x => x.username)]

                } else if (recipient.type === RecipientTypes.Project) {
                    const res = await getProjMembers(recipient.identifier);
                    if (!res) {
                        // setIsError(true);
                        // setErrorMessage("Could not retrieve project members");
                        enqueueSnackbar("Failed to retrieve project members", { variant: 'error', autoHideDuration: 8000 });
                        return;
                    }
                    if (res.length === 0) {
                        // setIsError(true);
                        // setErrorMessage(`No project members found for ${recipient.displayName}`);
                        enqueueSnackbar(`No project members found for ${recipient.displayName}`, { variant: 'error', autoHideDuration: 8000 });

                    }
                    finalisedRecipients = [... finalisedRecipients, ... res.map(x => x.username)]
                } else {
                    // Users
                    finalisedRecipients.push(recipient.identifier);
                }
            }

            const data: Announcement = {
                users: finalisedRecipients,
                subject: subject,
                body: body
            };

            const res = await createAnnouncement(data, token);

            if (res.status === ResponseType.Error) {
                // setErrorMessage(res.message);
                // setIsError(true);
                enqueueSnackbar("Failed to create announcement", { variant: 'error', autoHideDuration: 8000 });
                return;
            }

            enqueueSnackbar("Announcement Sent", { variant: 'success', autoHideDuration: 8000 });
        }
        finally {
            setIsLoading(false);
        }
    }

    return (
        <Box sx={{ maxWidth: 1100, margin: '0 auto', padding: 3 }}>
            <Typography variant="h4" color="primary" gutterBottom>
                Create Announcement
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
                Choose who should receive this announcement, then write your message.
            </Typography>

            <Paper variant="outlined" sx={{ padding: 3, marginTop: 2 }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Add recipients
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                            <TextField
                                select
                                size="small"
                                label="Recipient type"
                                value={recipientMode}
                                onChange={(event) => {
                                    setRecipientMode(event.target.value as RecipientTypes);
                                    setPendingUser(null);
                                }}
                                sx={{ minWidth: 180 }}
                            >
                                <MenuItem value={RecipientTypes.User}>Users</MenuItem>
                                <MenuItem value={RecipientTypes.Organisation}>Organisations</MenuItem>
                                <MenuItem value={RecipientTypes.Project}>Projects</MenuItem>
                            </TextField>
                            <Autocomplete
                                hidden={recipientMode !== RecipientTypes.User}
                                size="small"
                                sx={{ minWidth: 300, flex: 1 }}
                                options={filteredUsers}
                                getOptionLabel={(option) => `${option.name} - ${option.contactEmail}`}
                                value={pendingUser}
                                onChange={(_, value) => {
                                    if (value != null)
                                        return setPendingUser(value);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={`Search ${recipientMode}s`}
                                        placeholder="Start typing a name..."
                                    />
                                )}
                            />
                            <Autocomplete
                                hidden={recipientMode !== RecipientTypes.Project}
                                size="small"
                                sx={{ minWidth: 300, flex: 1 }}
                                options={filteredProjects}
                                getOptionLabel={(option) => option.name}
                                value={pendingProject}
                                onChange={(_, value) => {
                                    if (value != null)
                                        return setPendingProject(value)
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={`Search ${recipientMode}s`}
                                        placeholder="Start typing a name..."
                                    />
                                )}
                            />
                            <Autocomplete
                                hidden={recipientMode !== RecipientTypes.Organisation}
                                size="small"
                                sx={{ minWidth: 300, flex: 1 }}
                                options={filteredOrganisations}
                                getOptionLabel={(option) => option.name}
                                value={pendingOrg}
                                onChange={(_, value) => {
                                    if (value != null)
                                        return setPendingOrg(value)
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={`Search ${recipientMode}s`}
                                        placeholder="Start typing a name..."
                                    />
                                )}
                            />
                            <Button
                                variant="contained"
                                onClick={() => {
                                    let recipient: Recipient;

                                    if (recipientMode === RecipientTypes.User) {
                                        recipient = toUserRecipient(pendingUser!);
                                    }
                                    else if (recipientMode === RecipientTypes.Organisation) {
                                        recipient = toOrganisationRecipient(pendingOrg!)
                                    }
                                    else {
                                        recipient = toProjectRecipient(pendingProject!)
                                    }
                                    handleAddRecipient(recipient)
                                }}
                                disabled={!enableAddButton}
                            >
                                Add
                            </Button>
                        </Stack>
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            To
                        </Typography>
                        <Box
                            sx={{
                                minHeight: 56,
                                padding: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                backgroundColor: 'background.paper',
                            }}
                        >
                            {recipients.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ padding: 1 }}>
                                    No recipients selected.
                                </Typography>
                            ) : (
                                // Organisations
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {recipients.map((recipient) => (
                                        <Chip
                                            key={recipient.identifier}
                                            label={`${recipient.displayName}`}
                                            onDelete={() => handleRemoveRecipient(recipient)}
                                        />
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Box>
                    <Divider />
                    <TextField
                        label="Subject"
                        value={subject ?? ''}
                        onChange={(event) => setSubject(event.target.value)}
                        fullWidth
                        required
                        size="small"
                        placeholder="Write your announcement subject here"
                    />
                    <TextField
                        label="Message"
                        value={body ?? ''}
                        onChange={(event) => setBody(event.target.value)}
                        fullWidth
                        required
                        multiline
                        minRows={18}
                        placeholder="Write your announcement body here"
                    />
                </Stack>
            </Paper>
            <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ marginTop: 2 }}>
                <Button
                    startIcon={
                        isLoading ? <CircularProgress size={16} color="inherit" /> : <Send/>
                    }
                    sx={{
                    color: "white",
                    backgroundColor: Theme.SecondaryLightGreen
                }} disabled={!enableSendButton || isLoading} variant="contained" onClick={handleSend}>
                    Send announcement
                </Button>
            </Stack>
        </Box>
    );
}

export default Announcements;