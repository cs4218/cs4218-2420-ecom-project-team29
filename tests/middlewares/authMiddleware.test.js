import { jest } from '@jest/globals';
import JWT from 'jsonwebtoken';
import userModel from '../../models/userModel';
import { requireSignIn, isAdmin } from '../../middlewares/authMiddleware';

jest.mock('../../models/userModel');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {
        authorization: 'Bearer token',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('requireSignIn', () => {
    it('should verify token and set user in request', async () => {
      const mockDecode = { _id: '123', name: 'John Doe' };
      JWT.verify = jest.fn();
      JWT.verify.mockResolvedValue(mockDecode);

      await requireSignIn(req, res, next);

      expect(JWT.verify).toHaveBeenCalledWith('Bearer token', process.env.JWT_SECRET);
      expect(req.user).resolves.toEqual(mockDecode);
      expect(next).toHaveBeenCalled();
    });

    it('should handle token verification error', async () => {
      const error = new Error('Token verification failed');
      console.log = jest.fn();
      JWT.verify = jest.fn();
      JWT.verify.mockImplementationOnce(() => {
        throw error;
      });

      await requireSignIn(req, res, next);

      expect(JWT.verify).toHaveBeenCalledWith('Bearer token', process.env.JWT_SECRET);
      expect(console.log).toHaveBeenCalledWith(error);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in auth middleware",
        error,
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('should allow access for admin user', async () => {
      req.user = { _id: '123' };
      const mockUser = { _id: '123', role: 1 };
      userModel.findById = jest.fn();
      userModel.findById.mockResolvedValue(mockUser);

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledWith('123');
      expect(next).toHaveBeenCalled();
    });

    it('should deny access for non-admin user', async () => {
      req.user = { _id: '123' };
      const mockUser = { _id: '123', role: 0 };
      userModel.findById = jest.fn();
      userModel.findById.mockResolvedValue(mockUser);

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized Access',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle error in admin middleware', async () => {
      req.user = { _id: '123' };
      const error = new Error('Database error');
      console.log = jest.fn();
      userModel.findById = jest.fn();
      userModel.findById.mockImplementationOnce(() => {
        throw error;
      });

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledWith('123');
      expect(console.log).toHaveBeenCalledWith(error);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error,
        message: 'Error in admin middleware',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});