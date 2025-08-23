export interface IUser extends Document {
  _id: string;
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
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
}