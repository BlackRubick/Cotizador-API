const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { Op } = require('sequelize');

class AuthService {
  // Generate JWT token
  generateToken(userId, expiresIn = process.env.JWT_EXPIRE || '7d') {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
  }

  // Generate refresh token
  generateRefreshToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Generate password reset token
  generateResetToken() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    return { resetToken, hashedToken };
  }

  // Validate password strength
  validatePassword(password) {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    // Optional: Uncomment for stronger password requirements
    // if (!hasUpperCase) {
    //   errors.push('Password must contain at least one uppercase letter');
    // }
    // if (!hasLowerCase) {
    //   errors.push('Password must contain at least one lowercase letter');
    // }
    // if (!hasNumbers) {
    //   errors.push('Password must contain at least one number');
    // }
    // if (!hasSpecialChar) {
    //   errors.push('Password must contain at least one special character');
    // }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Check if user exists by email or username
  async findUserByEmailOrUsername(identifier) {
    try {
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { email: identifier.toLowerCase() },
            { username: identifier }
          ]
        }
      });
      return user;
    } catch (error) {
      throw new Error('Error finding user');
    }
  }

  // Authenticate user with credentials
  async authenticateUser(identifier, password) {
    try {
      const user = await this.findUserByEmailOrUsername(identifier);
      
      if (!user) {
        return { success: false, message: 'Invalid credentials' };
      }

      if (!user.isActive) {
        return { success: false, message: 'Account is deactivated' };
      }

      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          lastLogin: user.lastLogin
        }
      };
    } catch (error) {
      throw new Error('Authentication error');
    }
  }

  // Register new user
  async registerUser(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: userData.email.toLowerCase() },
            { username: userData.username }
          ]
        }
      });

      if (existingUser) {
        return { 
          success: false, 
          message: 'User already exists with this email or username' 
        };
      }

      // Validate password
      const passwordValidation = this.validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: 'Password validation failed',
          errors: passwordValidation.errors
        };
      }

      // Create user
      const user = await User.create({
        username: userData.username,
        email: userData.email.toLowerCase(),
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        position: userData.position,
        role: userData.role || 'user'
      });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      };
    } catch (error) {
      throw new Error('Registration error');
    }
  }

  // Initiate password reset
  async initiatePasswordReset(email) {
    try {
      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      
      if (!user) {
        // Don't reveal if user exists or not
        return { success: true, message: 'If email exists, reset instructions sent' };
      }

      const { resetToken, hashedToken } = this.generateResetToken();
      
      // Set reset token and expiration (10 minutes)
      const resetExpire = new Date(Date.now() + 10 * 60 * 1000);
      
      await user.update({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: resetExpire
      });

      return {
        success: true,
        resetToken, // This should be sent via email, not returned to client
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName
        }
      };
    } catch (error) {
      throw new Error('Password reset initiation error');
    }
  }

  // Reset password with token
  async resetPassword(resetToken, newPassword) {
    try {
      // Hash the token to match stored version
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      const user = await User.findOne({
        where: {
          resetPasswordToken: hashedToken,
          resetPasswordExpire: { [Op.gt]: new Date() }
        }
      });

      if (!user) {
        return { success: false, message: 'Invalid or expired reset token' };
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: 'Password validation failed',
          errors: passwordValidation.errors
        };
      }

      // Update password and clear reset token
      await user.update({
        password: newPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null
      });

      return { success: true, message: 'Password reset successful' };
    } catch (error) {
      throw new Error('Password reset error');
    }
  }

  // Change password (for authenticated users)
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: 'Password validation failed',
          errors: passwordValidation.errors
        };
      }

      // Update password
      await user.update({ password: newPassword });

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      throw new Error('Password change error');
    }
  }

  // Get user from token
  async getUserFromToken(token) {
    try {
      const decoded = this.verifyToken(token);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }
      });
      
      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  // Logout user (invalidate session)
  async logoutUser(userId) {
    try {
      // In a real application, you might want to blacklist the token
      // or store active sessions in Redis/database
      // For now, we'll just update the user's last activity
      
      const user = await User.findByPk(userId);
      if (user) {
        await user.update({ lastLogin: new Date() });
      }
      
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      throw new Error('Logout error');
    }
  }

  // Check if user has required role
  hasRole(user, requiredRole) {
    const roleHierarchy = {
      'user': 1,
      'manager': 2,
      'admin': 3
    };

    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    return userRoleLevel >= requiredRoleLevel;
  }

  // Check if user can access resource
  canAccessResource(user, resource, action = 'read') {
    // Define permissions matrix
    const permissions = {
      'admin': ['*'],
      'manager': ['users:read', 'clients:*', 'products:*', 'quotes:*', 'categories:*'],
      'user': ['clients:read', 'products:read', 'quotes:create', 'quotes:read', 'quotes:update', 'categories:read']
    };

    const userPermissions = permissions[user.role] || [];
    const requiredPermission = `${resource}:${action}`;
    const allPermission = `${resource}:*`;
    const superPermission = '*';

    return userPermissions.includes(requiredPermission) ||
           userPermissions.includes(allPermission) ||
           userPermissions.includes(superPermission);
  }
}

module.exports = new AuthService();