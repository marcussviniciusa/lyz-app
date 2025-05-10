import { Request, Response, NextFunction } from 'express';
import User, { UserRole, IUser } from '../models/User';
import { generateToken } from '../utils/jwt';
import mongoose from 'mongoose';

// Login controller
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      res.status(400).json({ 
        status: 'error', 
        message: 'Email and password are required' 
      });
      return;
    }
    
    // Find user by email
    const user = await User.findOne({ email }).select('+password') as IUser | null;
    
    if (!user) {
      res.status(401).json({ 
        status: 'error', 
        message: 'Invalid email or password' 
      });
      return;
    }
    
    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({ 
        status: 'error', 
        message: 'Account is inactive. Please contact your administrator' 
      });
      return;
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      res.status(401).json({ 
        status: 'error', 
        message: 'Invalid email or password' 
      });
      return;
    }
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = generateToken({
      userId: user._id instanceof mongoose.Types.ObjectId ? user._id.toString() : String(user._id),
      email: user.email,
      role: user.role,
      company: user.company instanceof mongoose.Types.ObjectId ? user.company.toString() : String(user.company)
    });
    
    // Return user data and token (exclude password)
    const userData = {
      id: user._id instanceof mongoose.Types.ObjectId ? user._id.toString() : String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company instanceof mongoose.Types.ObjectId ? user.company.toString() : String(user.company)
    };
    
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });
    return;
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'An error occurred during login' 
    });
    return;
  }
};

// Register new user (superadmin only)
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, company, isActive } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      res.status(400).json({ 
        status: 'error', 
        message: 'User with this email already exists' 
      });
      return;
    }
    
    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      role: role || UserRole.USER,
      company,
      isActive: isActive === undefined ? true : isActive
    });
    
    await newUser.save();
    
    // Return created user (exclude password)
    const userData = {
      id: newUser._id instanceof mongoose.Types.ObjectId ? newUser._id.toString() : String(newUser._id),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      company: newUser.company instanceof mongoose.Types.ObjectId ? newUser.company.toString() : String(newUser.company),
      isActive: newUser.isActive
    };
    
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user: userData
      }
    });
    return;
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'An error occurred during user registration' 
    });
    return;
  }
};

// Get current user info
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id instanceof mongoose.Types.ObjectId ? user._id.toString() : String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company instanceof mongoose.Types.ObjectId ? user.company.toString() : String(user.company),
          isActive: user.isActive,
          lastLogin: user.lastLogin
        }
      }
    });
    return;
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'An error occurred while fetching user data' 
    });
    return;
  }
};

// Change password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user as IUser;
    const userId = user._id instanceof mongoose.Types.ObjectId ? user._id : new mongoose.Types.ObjectId(String(user._id));
    
    if (!currentPassword || !newPassword) {
      res.status(400).json({ 
        status: 'error', 
        message: 'Current password and new password are required' 
      });
      return;
    }
    
    // Find user with password field
    const foundUser = await User.findById(userId).select('+password') as IUser | null;
    
    if (!foundUser) {
      res.status(404).json({ 
        status: 'error', 
        message: 'User not found' 
      });
      return;
    }
    
    // Verify current password
    const isPasswordValid = await foundUser.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      res.status(401).json({ 
        status: 'error', 
        message: 'Current password is incorrect' 
      });
      return;
    }
    
    // Update password
    foundUser.password = newPassword;
    await foundUser.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
    return;
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'An error occurred while changing password' 
    });
    return;
  }
};

// Reset user password (superadmin only)
export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, newPassword } = req.body;
    
    if (!userId || !newPassword) {
      res.status(400).json({ 
        status: 'error', 
        message: 'User ID and new password are required' 
      });
      return;
    }
    
    // Find user
    const user = await User.findById(userId) as IUser | null;
    
    if (!user) {
      res.status(404).json({ 
        status: 'error', 
        message: 'User not found' 
      });
      return;
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'User password reset successfully'
    });
    return;
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'An error occurred while resetting password' 
    });
    return;
  }
};

// Validate token endpoint - usado para verificar se o token é válido
export const validateToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // Se o middleware de autenticação passou, o token é válido
    // O req.user já foi definido pelo middleware authenticateToken
    const user = req.user as IUser;
    
    res.status(200).json({
      status: 'success',
      message: 'Token is valid',
      data: {
        userId: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'An error occurred during token validation' 
    });
  }
};
