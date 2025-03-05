import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import userModel from '../../models/userModel';

describe('User Model Test', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();
    await mongoose.connect(process.env.MONGO_URL);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  it('should create a user successfully', async () => {
    const user = new userModel({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Main St',
      answer: 'blue',
    });

    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe('John Doe');
    expect(savedUser.email).toBe('john.doe@example.com');
    expect(savedUser.password).toBe('password123');
    expect(savedUser.phone).toBe('1234567890');
    expect(savedUser.address).toBe('123 Main St');
    expect(savedUser.answer).toBe('blue');
    expect(savedUser.role).toBe(0);
  });

  it('should not create a user without required fields', async () => {
    const user = new userModel({
      name: 'John Doe',
    });

    let err;
    try {
      await user.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
    expect(err.errors.phone).toBeDefined();
    expect(err.errors.address).toBeDefined();
    expect(err.errors.answer).toBeDefined();
  });

  it('should not create a user with duplicate email', async () => {
    const user = new userModel({
      name: 'John Doe',
      email: 'test@mail.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Main St',
      answer: 'blue',
      role: 0,
    });

    await user.save();

    const duplicateUser = new userModel({
      name: 'Jane Doe',
      email: user.email,
      password: 'password123',
      phone: '1234567890',
      address: '123 Main St',
      answer: 'blue',
      role: 0,
    });

    let err;

    try {
      await duplicateUser.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
  });

  it('should trim user name', async () => {
    const user = new userModel({
      name: ' John Doe ',
      email: 'test1@mail.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Main St',
      answer: 'blue',
      role: 0,
    });

    const savedUser = await user.save();

    expect(savedUser.name).toBe('John Doe');
  });
});