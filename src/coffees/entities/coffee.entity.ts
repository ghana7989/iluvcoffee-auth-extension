import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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
export class Coffee {}

export type CoffeeDocument = HydratedDocument<Coffee>;

export const CoffeeSchema = SchemaFactory.createForClass(Coffee);
