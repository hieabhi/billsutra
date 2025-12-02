import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { readJSON, writeJSON } from '../utils/fileStore.js';
import { User } from '../models/User.js';

const FILE = 'users.json';

function readAll() { return readJSON(FILE, []); }
function saveAll(data) { writeJSON(FILE, data); }

export const usersRepo = {
  async getAll(hotelId = null) {
    const users = readAll();
    if (hotelId) {
      return users.filter(u => u.hotelId === hotelId);
    }
    return users;
  },

  async getById(id) {
    const users = readAll();
    return users.find(u => u._id === id);
  },

  async getByUsername(username) {
    const users = readAll();
    return users.find(u => u.username === username);
  },

  async getByEmail(email) {
    const users = readAll();
    return users.find(u => u.email === email);
  },

  async getByHotel(hotelId) {
    return this.getAll(hotelId);
  },

  async create(userData) {
    const users = readAll();
    
    // Check for duplicate username or email
    if (users.some(u => u.username === userData.username)) {
      throw new Error('Username already exists');
    }
    if (users.some(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }

    const now = new Date().toISOString();
    const user = {
      _id: uuidv4(),
      hotelId: userData.hotelId || null,
      username: userData.username,
      email: userData.email || '',
      password: userData.password, // Should already be hashed
      fullName: userData.fullName || '',
      role: userData.role || 'frontDesk',
      permissions: userData.permissions || [],
      status: userData.status || 'active',
      createdAt: now,
      updatedAt: now
    };

    // Validate using model
    const userModel = new User(user);
    const errors = userModel.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    users.push(user);
    saveAll(users);
    
    // Return without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async update(id, updates) {
    const users = readAll();
    const index = users.findIndex(u => u._id === id);
    
    if (index === -1) {
      throw new Error('User not found');
    }

    // Prevent role/hotelId changes for security
    delete updates.role;
    delete updates.hotelId;
    delete updates.password;

    const now = new Date().toISOString();
    users[index] = { ...users[index], ...updates, _id: id, updatedAt: now };
    saveAll(users);
    
    // Return user without password
    const { password, ...userWithoutPassword } = users[index];
    return userWithoutPassword;
  },

  async delete(id) {
    const users = readAll();
    const filtered = users.filter(u => u._id !== id);
    
    if (users.length === filtered.length) {
      throw new Error('User not found');
    }

    saveAll(filtered);
    return true;
  },

  async updatePassword(id, newPassword) {
    const users = readAll();
    const index = users.findIndex(u => u._id === id);
    
    if (index === -1) {
      throw new Error('User not found');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    users[index].password = hashedPassword;
    users[index].updatedAt = new Date().toISOString();
    saveAll(users);
    return true;
  }
};
