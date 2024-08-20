import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User, UserDocument } from '../../entities/user.entity';
import { forwardRef } from '@nestjs/common';

export type ApiKeyDocument = HydratedDocument<ApiKey>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
})
export class ApiKey {
  @Prop()
  key: string;

  @Prop()
  uuid: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    select: true,
  })
  user: UserDocument;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

ApiKeySchema.pre<ApiKeyDocument>('findOne', function (next) {
  this.populate('user');
  next();
});
