import { Group, GroupRole, User } from '../../types/dtos';

export const sortGroups = (groups: Group[], _user: User) => {
  const personalOrgGroups = groups.filter(
    (_group) =>
      _group.organisation?.abbreviation === _user.orgAbbrev &&
    (!_group.name.endsWith('Contributor') && !_group.name.endsWith('Everyone')),
  );

  const foriegnOrgGroups = groups.filter(
    (_group) =>
      (_group.organisation?.abbreviation !== _user.orgAbbrev &&
          _group.organisation?.abbreviation !== undefined) &&
          (!_group.name.endsWith('Owner') && !_group.name.endsWith('Everyone')),
  );

  const otherGroups = groups.filter(
    (_group) =>
      !personalOrgGroups.includes(_group) &&
          !foriegnOrgGroups.includes(_group) &&
          (_group.organisation?.abbreviation === undefined ||
            _group.organisation === null),
  );

  return [personalOrgGroups, foriegnOrgGroups, otherGroups];
};

export const sortGroupRoles = (userGroupRoles: GroupRole[], user:User) => {
  const personalOrgs = userGroupRoles.filter(
    (group) =>
      group.group.organisation?.abbreviation === user.orgAbbrev,
  ).sort((a, b) => a.group.name.localeCompare(b.group.name));

  const foreignOrgs = userGroupRoles.filter(
    (group) =>
      group.group.organisation?.abbreviation !== user.orgAbbrev &&
          group.group.organisation?.abbreviation !== undefined,
  ).sort((a, b) => a.group.name.localeCompare(b.group.name));

  const otherGroups = userGroupRoles.filter(
    (group) =>
      !personalOrgs.includes(group) &&
          !foreignOrgs.includes(group) &&
          (group.group.organisation?.abbreviation === undefined ||
            group.group.organisation === null),
  ).sort((a, b) => a.group.name.localeCompare(b.group.name));

  return [personalOrgs, foreignOrgs, otherGroups];
};
