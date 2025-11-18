import express from 'express';
import { hotelsRepo } from '../repositories/hotelsRepo.js';
import { floorsRepo } from '../repositories/floorsRepo.js';
import { usersRepo } from '../repositories/usersRepo.js';
import bcrypt from 'bcryptjs';
import { authMiddleware, requireSuperAdmin, requireHotelAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all hotels (Super Admin only)
router.get('/', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const hotels = await hotelsRepo.getAll();
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single hotel
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const hotel = await hotelsRepo.getById(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Users can only view their own hotel unless super admin
    if (req.user.role !== 'superAdmin' && req.user.hotelId !== hotel.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new hotel with onboarding (Super Admin only)
router.post('/onboard', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { hotelInfo, floors, admin } = req.body;

    // Step 1: Create hotel
    const hotel = await hotelsRepo.create({
      ...hotelInfo,
      createdBy: req.user.id
    });

    // Step 2: Create floors if provided
    if (floors && floors.length > 0) {
      const floorData = floors.map((floor, index) => ({
        hotelId: hotel.id,
        name: floor.name,
        number: floor.number,
        displayOrder: index
      }));
      await floorsRepo.createMultiple(floorData);
    }

    // Step 3: Create hotel admin user
    if (admin) {
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      await usersRepo.create({
        username: admin.username,
        email: admin.email,
        password: hashedPassword,
        role: 'hotelAdmin',
        hotelId: hotel.id,
        status: 'active'
      });
    }

    res.json({
      success: true,
      hotel,
      message: 'Hotel onboarded successfully'
    });
  } catch (error) {
    console.error('Hotel onboarding error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update hotel
router.put('/:id', authMiddleware, requireHotelAdmin, async (req, res) => {
  try {
    const hotelId = req.params.id;

    // Users can only update their own hotel unless super admin
    if (req.user.role !== 'superAdmin' && req.user.hotelId !== hotelId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const hotel = await hotelsRepo.update(hotelId, req.body);
    res.json(hotel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete hotel (Super Admin only)
router.delete('/:id', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    await hotelsRepo.delete(req.params.id);
    
    // Also delete related floors
    await floorsRepo.deleteByHotel(req.params.id);
    
    res.json({ success: true, message: 'Hotel deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get hotel floors
router.get('/:id/floors', authMiddleware, async (req, res) => {
  try {
    const hotelId = req.params.id;

    // Users can only view their own hotel's floors unless super admin
    if (req.user.role !== 'superAdmin' && req.user.hotelId !== hotelId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const floors = await floorsRepo.getByHotel(hotelId);
    res.json(floors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add floor to hotel
router.post('/:id/floors', authMiddleware, requireHotelAdmin, async (req, res) => {
  try {
    const hotelId = req.params.id;

    // Users can only add floors to their own hotel unless super admin
    if (req.user.role !== 'superAdmin' && req.user.hotelId !== hotelId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const floor = await floorsRepo.create({
      ...req.body,
      hotelId
    });

    res.json(floor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
