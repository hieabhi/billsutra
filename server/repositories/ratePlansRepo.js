import { v4 as uuidv4 } from 'uuid';
import { readJSON, writeJSON } from '../utils/fileStore.js';
import { RatePlan, RATE_PLAN_TYPE } from '../models/RatePlan.js';

const FILE = 'rate_plans.json';

function readAll(){ return readJSON(FILE, []);} 
function saveAll(d){ writeJSON(FILE, d);} 

export const ratePlansRepo = {
  async getAll(hotelId) {
    const plans = readAll();
    if (!hotelId) return plans;
    return plans.filter(p => p.hotelId === hotelId)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  },

  async list(hotelId){ 
    return this.getAll(hotelId);
  },

  async getById(id, hotelId = null) {
    const plans = readAll();
    const plan = plans.find(p => p._id === id);
    if (plan && hotelId && plan.hotelId !== hotelId) return null;
    return plan;
  },

  async getByCode(code, hotelId) {
    const plans = readAll();
    return plans.find(p => p.code === code && p.hotelId === hotelId);
  },

  // Legacy method for backward compatibility
  async getByRoomType(roomTypeName){
    const plans = readAll();
    let plan = plans.find(p => (p.roomTypeName||'').toLowerCase() === String(roomTypeName).toLowerCase());
    if (!plan) {
      plan = { _id: uuidv4(), roomTypeName, overrides: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      plans.push(plan); saveAll(plans);
    }
    return plan;
  },

  async getActive(hotelId, date = null) {
    const plans = await this.getAll(hotelId);
    const checkDate = date || new Date().toISOString().split('T')[0];
    
    return plans.filter(plan => {
      const planModel = new RatePlan(plan);
      return planModel.isValid(checkDate);
    });
  },

  async getApplicablePlans(hotelId, roomTypeId, date, nights) {
    const activePlans = await this.getActive(hotelId, date);
    
    return activePlans.filter(plan => {
      if (plan.roomTypeId && plan.roomTypeId !== roomTypeId) return false;
      if (nights < plan.minStay) return false;
      if (plan.maxStay && nights > plan.maxStay) return false;
      return true;
    }).sort((a, b) => (b.priority || 0) - (a.priority || 0));
  },

  async create(data) {
    const plans = readAll();
    
    if (data.hotelId && data.code) {
      const existing = plans.find(p => 
        p.code === data.code && p.hotelId === data.hotelId
      );
      if (existing) {
        throw new Error(`Rate plan with code "${data.code}" already exists in this hotel`);
      }
    }

    const now = new Date().toISOString();
    const plan = {
      _id: uuidv4(),
      hotelId: data.hotelId || null,
      name: data.name,
      code: data.code || data.name.toUpperCase().replace(/\s+/g, '_').substring(0, 15),
      type: data.type || RATE_PLAN_TYPE.BASE,
      roomTypeId: data.roomTypeId || null,
      baseRateAdjustment: Number(data.baseRateAdjustment || 0),
      adjustmentType: data.adjustmentType || 'PERCENTAGE',
      validFrom: data.validFrom || null,
      validTo: data.validTo || null,
      daysOfWeek: data.daysOfWeek || [],
      minStay: Number(data.minStay || 1),
      maxStay: data.maxStay ? Number(data.maxStay) : null,
      includesBreakfast: data.includesBreakfast || false,
      refundable: data.refundable !== undefined ? data.refundable : true,
      cancellationPolicy: data.cancellationPolicy || '',
      active: data.active !== undefined ? data.active : true,
      priority: Number(data.priority || 0),
      createdAt: now,
      updatedAt: now,
    };

    const planModel = new RatePlan(plan);
    const errors = planModel.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    plans.push(plan);
    saveAll(plans);
    return plan;
  },

  async update(id, data, hotelId = null) {
    const plans = readAll();
    const idx = plans.findIndex(p => p._id === id);
    if (idx === -1) return null;
    
    if (hotelId && plans[idx].hotelId !== hotelId) return null;

    if (data.code && data.code !== plans[idx].code && plans[idx].hotelId) {
      const duplicate = plans.find(p => 
        p.code === data.code && 
        p.hotelId === plans[idx].hotelId &&
        p._id !== id
      );
      if (duplicate) {
        throw new Error(`Rate plan with code "${data.code}" already exists in this hotel`);
      }
    }

    const now = new Date().toISOString();
    const updated = {
      ...plans[idx],
      ...data,
      hotelId: plans[idx].hotelId,
      _id: plans[idx]._id,
      updatedAt: now
    };

    plans[idx] = updated;
    saveAll(plans);
    return updated;
  },

  async remove(id, hotelId = null) {
    const plans = readAll();
    const idx = plans.findIndex(p => p._id === id);
    if (idx === -1) return null;
    
    if (hotelId && plans[idx].hotelId !== hotelId) return null;

    const [removed] = plans.splice(idx, 1);
    saveAll(plans);
    return removed;
  },

  async calculateBestRate(hotelId, roomTypeId, baseRate, checkInDate, nights) {
    const applicablePlans = await this.getApplicablePlans(
      hotelId, 
      roomTypeId, 
      checkInDate, 
      nights
    );

    if (applicablePlans.length === 0) {
      return { baseRate, finalRate: baseRate, ratePlan: null };
    }

    const bestPlan = applicablePlans[0];
    const planModel = new RatePlan(bestPlan);
    const finalRate = planModel.calculateRate(baseRate);

    return {
      baseRate,
      finalRate: Math.round(finalRate * 100) / 100,
      ratePlan: bestPlan,
      adjustment: finalRate - baseRate
    };
  },

  // Legacy methods for backward compatibility
  async setOverrides(roomTypeName, overrides){
    const plans = readAll();
    const idx = plans.findIndex(p => (p.roomTypeName||'').toLowerCase() === String(roomTypeName).toLowerCase());
    const now = new Date().toISOString();
    if (idx === -1) {
      const plan = { _id: uuidv4(), roomTypeName, overrides: overrides||{}, createdAt: now, updatedAt: now };
      plans.push(plan); saveAll(plans); return plan;
    }
    plans[idx] = { ...plans[idx], overrides: overrides||{}, updatedAt: now };
    saveAll(plans); return plans[idx];
  },

  async clearOverride(roomTypeName, date){
    const plans = readAll();
    const idx = plans.findIndex(p => (p.roomTypeName||'').toLowerCase() === String(roomTypeName).toLowerCase());
    if (idx === -1) return null;
    const ov = { ...plans[idx].overrides };
    delete ov[date];
    plans[idx] = { ...plans[idx], overrides: ov, updatedAt: new Date().toISOString() };
    saveAll(plans); return plans[idx];
  }
};
