export const USER_SEARCHABLE_FIELDS = ['name', 'email', 'username'];

export const USER_FILTERABLE_FIELDS = [
  'searchTerm',
  'role',
  'status',
  'emailVerified',
  'delete',
  'select',
  'isDelete',
  'needProperty',
];

export const USER_TYPES = ['admin', 'author', 'editor', 'user'];
export const USER_STATUS = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

export const ENUM_YN = {
    YES: 'YES',
    NO: 'NO',
  } as const;