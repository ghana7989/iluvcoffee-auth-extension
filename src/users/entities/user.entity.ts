import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Role } from '../enums/role.enum';
import {
  Permission,
  PermissionType,
} from 'src/iam/authorization/permission.type';
import { Permissions } from 'src/iam/authorization/decorators/permissions.decorator';
import { ApiKey } from '../api-keys/entities/api-key.entity';
export type UserDocument = HydratedDocument<User>;

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
    type: String,
  })
  role: Role;

  @Prop({
    type: [String],
    default: [],
    enum: Permission,
  })
  permissions: PermissionType[];

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
    ref: ApiKey.name,
    select: true,
  })
  apiKeys: ApiKey[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<UserDocument>('findOne', function (next) {
  this.populate('apiKeys');
  next();
});
