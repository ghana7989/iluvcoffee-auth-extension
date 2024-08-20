import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../enums/role.enum';
import {
  Permission,
  PermissionType,
} from 'src/iam/authorization/permission.type';
import { Permissions } from 'src/iam/authorization/decorators/permissions.decorator';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  @Prop({
    unique: true,
    required: true,
  })
  email: string;

  @Prop({
    required: true,
  })
  password: string;

  @Prop({
    default: Role.Regular,
  })
  role: Role;

  @Prop({
    type: [String],
    default: [],
    enum: Permission,
  })
  permissions: PermissionType[];
}

export const UserSchema = SchemaFactory.createForClass(User);

export type UserDocument = HydratedDocument<User>;
