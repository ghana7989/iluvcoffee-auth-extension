import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';
import { Coffee } from './entities/coffee.entity';

@Injectable()
export class CoffeesService {
  constructor(
    @InjectModel(Coffee.name) private readonly coffeeModel: Model<Coffee>,
  ) {}
  create(createCoffeeDto: CreateCoffeeDto) {
    const coffee = new this.coffeeModel(createCoffeeDto);
    return coffee.save();
  }

  async findAll() {
    return await this.coffeeModel.find().exec();
  }

  async findOne(id: string) {
    const coffee = await this.coffeeModel.findOne({ _id: id }).exec();
    if (!coffee) {
      throw new NotFoundException(`Coffee #${id} not found`);
    }
    return coffee;
  }

  async update(id: number, updateCoffeeDto: UpdateCoffeeDto) {
    const existingCoffee = await this.coffeeModel
      .findOneAndUpdate(
        { _id: id },
        {
          $set: updateCoffeeDto,
        },
        {
          new: true,
        },
      )
      .exec();
    if (!existingCoffee) {
      throw new NotFoundException(`Coffee #${id} not found`);
    }
    return existingCoffee;
  }

  async remove(id: string): Promise<Coffee | null> {
    const coffee = await this.findOne(id);
    if (!coffee) {
      throw new NotFoundException(`Coffee #${id} not found`);
    }
    return coffee.deleteOne();
  }
}
