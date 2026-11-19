import { Send, Warning } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApi } from '../../app/ApiContext';
import { Theme } from '../../assets/themes/theme';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import type { Announcement, Member, Organisation, Project, UserList } from '../../types/dtos';
import {
  createAnnouncement,
  getOrganisations,
  getOrgMembers,
  getProjectList,
  getProjectMembers,
  getUserList,
} from '../../utilities/resourceUtils';
import CustomDrawer from '../Common/CustomDrawer';
import ChangesDialog from '../Users/MainViews/ChangesDialog';

const messageDuration = 8000;
const subjectMaxLength = 200;

enum RecipientTypes {
  User = 'User',
  Organisation = 'Organisation',
  Project = 'Project',
  System = 'System',
}

interface Recipient {
  type: RecipientTypes;
  identifier: string;
  displayName: string;
}

const toUserRecipient = (user: UserList): Recipient => ({
  type: RecipientTypes.User,
  identifier: user.globalId,
  displayName: `${user.username} (${user.contactEmail})`,
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
  const [isLoading, setIsLoading] = useState(false);
  const sendingRef = useRef(false);

  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserList[]>([]);

  const [orgMembers, setOrgMembers] = useState<Record<string, Member[]>>({});
  const [projectMembers, setProjectMembers] = useState<Record<string, Member[]>>({});

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');

  const [recipientMode, setRecipientMode] = useState<RecipientTypes>(RecipientTypes.User);
  const [pendingUser, setPendingUser] = useState<UserList | null>(null);
  const [pendingOrg, setPendingOrg] = useState<Organisation | null>(null);
  const [pendingProject, setPendingProject] = useState<Project | null>(null);

  const [examinedRecipient, setExaminedRecipient] = useState<Recipient | null>(null);

  const [showSystemConfirmation, setShowSystemConfirmation] = useState(false);
  const [showWarningConfirmation, setShowWarningConfirmation] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const isSystemMode = recipientMode === RecipientTypes.System;

  const hasPendingSelection =
    (recipientMode === RecipientTypes.User && !!pendingUser) ||
    (recipientMode === RecipientTypes.Organisation && !!pendingOrg) ||
    (recipientMode === RecipientTypes.Project && !!pendingProject);

  const enableAddButton = !isSystemMode && hasPendingSelection && !isLoading;
  const hasRecipients = isSystemMode ? users.length > 0 : recipients.length > 0;
  const enableSendButton = hasRecipients && !!subject.trim() && !!body.trim();

  // Filters to ensure we exclude existing selections in autocomplete
  const filteredOrganisations = useMemo(() => {
    const orgRecipients = new Set(
      recipients.filter((x) => x.type === RecipientTypes.Organisation).map((x) => x.identifier),
    );

    return organisations.filter((o) => !orgRecipients.has(o.globalId));
  }, [organisations, recipients]);

  const filteredUsers = useMemo(() => {
    const userRecipients = new Set(
      recipients.filter((x) => x.type === RecipientTypes.User).map((x) => x.identifier),
    );

    return users.filter((u) => !userRecipients.has(u.globalId));
  }, [users, recipients]);

  const filteredProjects = useMemo(() => {
    const projectRecipients = new Set(
      recipients.filter((x) => x.type === RecipientTypes.Project).map((x) => x.identifier),
    );

    return projects.filter((p) => !projectRecipients.has(p.globalId));
  }, [projects, recipients]);

  const examinedMembers =
    examinedRecipient === null
      ? []
      : ((examinedRecipient.type === RecipientTypes.Organisation
          ? orgMembers[examinedRecipient.identifier]
          : projectMembers[examinedRecipient.identifier]) ?? []);

  const getMembers = (recipient: Recipient): Member[] => {
    if (recipient.type === RecipientTypes.Organisation) {
      return orgMembers[recipient.identifier] ?? [];
    }
    if (recipient.type === RecipientTypes.Project) {
      return projectMembers[recipient.identifier] ?? [];
    }
    return [];
  };

  const getEmptyRecipients = () =>
    recipients.filter((r) => r.type !== RecipientTypes.User && getMembers(r).length === 0);

  useEffect(() => {
    const isTokenReady =
      tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING;

    if (!isTokenReady) return;

    const fetchOrganisations = async () => {
      const orgRes = await getOrganisations(false, token);

      if (orgRes.status !== ResponseType.Success) {
        setOrganisations([]);
        enqueueSnackbar(orgRes.message, { variant: 'error', autoHideDuration: messageDuration });
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
      const userRes = await getUserList(false, token);

      if (userRes.status !== ResponseType.Success) {
        setUsers([]);
        enqueueSnackbar(userRes.message, { variant: 'error', autoHideDuration: messageDuration });
        return;
      }

      const users = userRes.data as UserList[];

      if (users === undefined || users.length === 0) {
        setUsers([]);
      } else {
        setUsers(users.filter((x) => !x.isAusTrakkaProcess));
      }
    };

    const fetchProjects = async () => {
      const projectRes = await getProjectList(token);

      if (projectRes.status !== ResponseType.Success) {
        setProjects([]);
        enqueueSnackbar(projectRes.message, {
          variant: 'error',
          autoHideDuration: messageDuration,
        });
        return;
      }

      const projects = projectRes.data;

      if (projects === undefined || projects.length === 0) {
        setProjects([]);
      } else {
        setProjects(projects);
      }
    };

    const loadAll = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchOrganisations(), fetchUsers(), fetchProjects()]);
      } catch {
        enqueueSnackbar('Failed to load announcement data', {
          variant: 'error',
          autoHideDuration: messageDuration,
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadAll();
  }, [token, tokenLoading, enqueueSnackbar]);

  const handleAddRecipient = async (recipient: Recipient) => {
    try {
      setIsLoading(true);

      if (recipient.type === RecipientTypes.Organisation) {
        const res = await getOrganisationMembers(recipient.identifier);
        if (!res) {
          enqueueSnackbar('Failed to retrieve organisation members', {
            variant: 'error',
            autoHideDuration: messageDuration,
          });
          return;
        }
        setOrgMembers((prev) => ({ ...prev, [recipient.identifier]: res }));
      } else if (recipient.type === RecipientTypes.Project) {
        const res = await getProjMembers(recipient.identifier);
        if (!res) {
          enqueueSnackbar('Failed to retrieve project members', {
            variant: 'error',
            autoHideDuration: messageDuration,
          });
          return;
        }
        setProjectMembers((prev) => ({ ...prev, [recipient.identifier]: res }));
      }

      setRecipients((current) =>
        current.some((r) => r.type === recipient.type && r.identifier === recipient.identifier)
          ? current
          : [...current, recipient],
      );
    } finally {
      setPendingOrg(null);
      setPendingUser(null);
      setPendingProject(null);
      setIsLoading(false);
    }
  };

  const handleRemoveRecipient = (recipient: Recipient) => {
    setRecipients((current) =>
      current.filter((r) => !(r.type === recipient.type && r.identifier === recipient.identifier)),
    );
    setExaminedRecipient(null);
  };

  const handleRecipientModeChange = (nextMode: RecipientTypes) => {
    setRecipientMode(nextMode);
    setPendingUser(null);
    setPendingProject(null);
    setPendingOrg(null);
    setExaminedRecipient(null);

    // Even if they don't affect system announcements, clearing this seems more intuitive
    if (nextMode === RecipientTypes.System) {
      setRecipients([]);
    }
  };

  const getOrganisationMembers = async (identifier: string) => {
    const res = await getOrgMembers(identifier, token);

    if (res.status !== ResponseType.Success) {
      enqueueSnackbar(res.message, { variant: 'error', autoHideDuration: messageDuration });
      return;
    }

    if (!Array.isArray(res.data)) return;
    return (res.data as Member[]).filter((x) => !x.isAusTrakkaProcess);
  };

  const getProjMembers = async (identifier: string) => {
    const res = await getProjectMembers(identifier, token);

    if (res.status !== ResponseType.Success) {
      enqueueSnackbar(res.message, { variant: 'error', autoHideDuration: messageDuration });
      return;
    }
    if (!Array.isArray(res.data)) return;
    return (res.data as Member[]).filter((x) => !x.isAusTrakkaProcess);
  };

  const handleSend = async () => {
    // helps prevent double send behaviour
    if (sendingRef.current) return;

    if (!hasRecipients) {
      enqueueSnackbar('No recipients declared', {
        variant: 'error',
        autoHideDuration: messageDuration,
      });
      return;
    }
    if (!subject.trim()) {
      enqueueSnackbar('Subject is required', {
        variant: 'error',
        autoHideDuration: messageDuration,
      });
      return;
    }
    if (!body.trim()) {
      enqueueSnackbar('Body is required', { variant: 'error', autoHideDuration: messageDuration });
      return;
    }

    sendingRef.current = true;
    try {
      setIsLoading(true);
      let finalisedRecipients: string[] = [];

      if (isSystemMode) {
        finalisedRecipients = users.map((x) => x.globalId);
      } else {
        for (const recipient of recipients) {
          if (
            recipient.type === RecipientTypes.Organisation ||
            recipient.type === RecipientTypes.Project
          ) {
            const members = getMembers(recipient);

            if (members.length === 0) {
              enqueueSnackbar(`No ${recipient.type} members found for ${recipient.displayName}`, {
                variant: 'error',
                autoHideDuration: messageDuration,
              });
              return;
            }
            finalisedRecipients = [...finalisedRecipients, ...members.map((x) => x.globalId)];
          } else {
            finalisedRecipients.push(recipient.identifier);
          }
        }
      }

      const data: Announcement = {
        users: finalisedRecipients,
        subject: subject.trim(),
        body: body.trim(),
      };

      const res = await createAnnouncement(data, token);

      if (res.status !== ResponseType.Success) {
        enqueueSnackbar(res.message, {
          variant: 'error',
          autoHideDuration: messageDuration,
        });
        return;
      }
      enqueueSnackbar('Announcement Sent', {
        variant: 'success',
        autoHideDuration: messageDuration,
      });
    } catch {
      enqueueSnackbar('Could not reach server', {
        variant: 'error',
        autoHideDuration: messageDuration,
      });
    } finally {
      sendingRef.current = false;
      setIsLoading(false);
    }
  };

  const onAnnouncementSend = async () => {
    if (isSystemMode) {
      setShowSystemConfirmation(true);
      return;
    }
    if (getEmptyRecipients().length > 0) {
      setShowWarningConfirmation(true);
      return;
    }
    await handleSend();
  };

  // Easier to read if we resolve this here rather than main body
  const renderRecipientList = () => {
    if (recipients.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ padding: 1 }}>
          No recipients selected.
        </Typography>
      );
    }

    return (
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {recipients.map((recipient) => {
          const isDrilldown = recipient.type !== RecipientTypes.User;
          const memberCount = isDrilldown ? getMembers(recipient).length : 0;

          const label = isDrilldown
            ? `${recipient.displayName} (${memberCount})`
            : recipient.displayName;

          return (
            <Chip
              key={recipient.identifier}
              icon={
                isDrilldown && memberCount === 0 ? (
                  <Warning fontSize="small" color="warning" />
                ) : undefined
              }
              label={label}
              onClick={isDrilldown ? () => setExaminedRecipient(recipient) : undefined}
              onDelete={() => handleRemoveRecipient(recipient)}
              sx={{
                ...(isDrilldown
                  ? {
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                      '&:hover': { backgroundColor: 'action.hover' },
                    }
                  : {}),
              }}
            />
          );
        })}
      </Stack>
    );
  };

  return (
    <Box sx={{ maxWidth: 1100, margin: '0 auto', padding: 3 }}>
      <Typography variant="h4" color="primary" gutterBottom>
        Create Announcement
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" />
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
                  handleRecipientModeChange(event.target.value as RecipientTypes);
                }}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value={RecipientTypes.User}>Users</MenuItem>
                <MenuItem value={RecipientTypes.Organisation}>Organisations</MenuItem>
                <MenuItem value={RecipientTypes.Project}>Projects</MenuItem>
                <MenuItem value={RecipientTypes.System}>System (all users)</MenuItem>
              </TextField>
              <Autocomplete
                size="small"
                sx={{
                  minWidth: 300,
                  flex: 1,
                  display: recipientMode !== RecipientTypes.User ? 'none' : undefined,
                }}
                options={filteredUsers}
                getOptionLabel={(option) => `${option.username} - ${option.contactEmail}`}
                value={pendingUser}
                onChange={(_, value) => setPendingUser(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Search ${recipientMode}s`}
                    placeholder="Start typing a name..."
                  />
                )}
              />
              <Autocomplete
                size="small"
                sx={{
                  minWidth: 300,
                  flex: 1,
                  display: recipientMode !== RecipientTypes.Project ? 'none' : undefined,
                }}
                options={filteredProjects}
                getOptionLabel={(option) => option.name}
                value={pendingProject}
                onChange={(_, value) => setPendingProject(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Search ${recipientMode}s`}
                    placeholder="Start typing a name..."
                  />
                )}
              />
              <Autocomplete
                size="small"
                sx={{
                  minWidth: 300,
                  flex: 1,
                  display: recipientMode !== RecipientTypes.Organisation ? 'none' : undefined,
                }}
                options={filteredOrganisations}
                getOptionLabel={(option) => option.name}
                value={pendingOrg}
                onChange={(_, value) => setPendingOrg(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Search ${recipientMode}s`}
                    placeholder="Start typing a name..."
                  />
                )}
              />
              {!isSystemMode && (
                <Button
                  variant="contained"
                  onClick={() => {
                    let recipient: Recipient;
                    if (recipientMode === RecipientTypes.User) {
                      recipient = toUserRecipient(pendingUser!);
                    } else if (recipientMode === RecipientTypes.Organisation) {
                      recipient = toOrganisationRecipient(pendingOrg!);
                    } else {
                      recipient = toProjectRecipient(pendingProject!);
                    }
                    void handleAddRecipient(recipient);
                  }}
                  disabled={!enableAddButton}
                >
                  Add
                </Button>
              )}
            </Stack>
          </Box>
          {!isSystemMode ? (
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
                {renderRecipientList()}
              </Box>
            </Box>
          ) : null}
          <Divider />
          <TextField
            label="Subject"
            value={subject}
            type="text"
            onChange={(event) => setSubject(event.target.value)}
            fullWidth
            required
            variant="outlined"
            size="small"
            placeholder="Write your subject here"
            helperText={`${subject.length}/${subjectMaxLength}`}
            slotProps={{
              htmlInput: {
                maxLength: subjectMaxLength,
              },
            }}
          />
          <TextField
            label="Message"
            type="text"
            value={body}
            variant="outlined"
            onChange={(event) => setBody(event.target.value)}
            fullWidth
            required
            multiline
            minRows={14}
            maxRows={14}
            placeholder="Write your body here"
          />
        </Stack>
      </Paper>
      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ marginTop: 2 }}>
        <Button
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Send />}
          sx={{
            color: 'white',
            backgroundColor: Theme.SecondaryLightGreen,
          }}
          disabled={!enableSendButton || isLoading}
          variant="contained"
          onClick={onAnnouncementSend}
        >
          Send announcement
        </Button>
      </Stack>
      <CustomDrawer
        drawerOpen={examinedRecipient !== null}
        setDrawerOpen={(open) => {
          if (!open) setExaminedRecipient(null);
        }}
      >
        {examinedRecipient && (
          <Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
              <Typography variant="h4" color="primary">
                {examinedRecipient.displayName} members
              </Typography>
            </Box>
            {examinedMembers.length > 0 ? (
              <Box>
                <Typography sx={{ paddingTop: '20px' }} variant="subtitle2">
                  This {examinedRecipient?.type} contains the following members
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {examinedMembers.map((f) => {
                    return (
                      <Chip
                        key={f.username}
                        label={`${f.username} (${f.contactEmail})`}
                        sx={{ margin: '5px' }}
                      />
                    );
                  })}
                </Box>
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                  <Typography sx={{ paddingTop: '20px' }} variant="subtitle2">
                    This {examinedRecipient?.type} contains no members
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </CustomDrawer>
      <ChangesDialog
        id={'empty-members-warning-dialog'}
        severity={'warning'}
        title={'Warning'}
        isOpen={showWarningConfirmation}
        onClose={() => setShowWarningConfirmation(false)}
        confirmLoading={isLoading}
        confirmIcon={<></>}
        confirmText={'OK'}
        onConfirm={() => setShowWarningConfirmation(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" fontSize=".9rem" textAlign={'left'}>
            One or more recipients have no members and will need to be removed in order to proceed.
          </Typography>
          <List sx={{ paddingTop: '20px', paddingBottom: '20px' }} dense>
            {getEmptyRecipients().map((recipient) => {
              return (
                <ListItem key={recipient.identifier}>
                  <ListItemText secondary={`${recipient.displayName} (${recipient.type})`} />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </ChangesDialog>
      <ChangesDialog
        id={'system-announcement-warning-dialog'}
        severity={'warning'}
        title={'System Announcement'}
        isOpen={showSystemConfirmation}
        onClose={() => setShowSystemConfirmation(false)}
        onCancel={() => setShowSystemConfirmation(false)}
        confirmLoading={isLoading}
        onConfirm={async () => {
          try {
            await handleSend();
          } finally {
            setShowSystemConfirmation(false);
          }
        }}
      >
        <Typography variant="body2" textAlign={'center'}>
          Sending a System-Wide announcement to {users.length} users
        </Typography>
        <Typography variant="body2" textAlign={'center'}>
          Are you sure you want to continue?
        </Typography>
      </ChangesDialog>
    </Box>
  );
}

export default Announcements;
