export interface IUser extends Document {
  _id: string;
  avatar?: string;
  email: string;
  username: string;
  password: string;
  role: Role;
  userPermissions: IUserPermission[];
  deletedAt?: Date | null;
}


export interface IUserPermission {
  name: string;
}

export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
}