import { Role } from 'src/users/enums/role.enum';
import { PermissionType } from '../authorization/permission.type';

export interface ActiveUserData {
  /**
   * the subject of the token, the value of this property is user ID
   */
  sub: string;

  /**
   * the email of the user
   */
  email: string;

  /**
   * the role of the user
   */
  role: Role;

  /**
   * the permissions of the user
   */
  permissions: PermissionType[];
}
