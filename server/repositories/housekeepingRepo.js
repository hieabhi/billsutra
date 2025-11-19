import supabase, { mapHousekeepingFromDB } from '../config/supabase.js';
import { HousekeepingTask, TASK_STATUS, TASK_PRIORITY, TASK_TYPE } from '../models/HousekeepingTask.js';

console.log('🚀 LOADING SUPABASE HOUSEKEEPINGREPO');

function getTenantId(hotelId) {
  return hotelId;
}

export const housekeepingRepo = {
  async getAll(hotelId, filters = {}) {
    const tenantId = getTenantId(hotelId);
    
    let query = supabase
      .from('housekeeping')
      .select('*, rooms!inner(room_number)')
      .eq('tenant_id', tenantId);
    
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.roomId) query = query.eq('room_id', filters.roomId);
    if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
    if (filters.type) query = query.eq('task_type', filters.type);
    
    query = query.order('created_at', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    
    const tasks = (data || []).map(task => {
      const mapped = mapHousekeepingFromDB(task);
      if (task.rooms) mapped.roomNumber = task.rooms.room_number;
      return mapped;
    });
    
    return tasks;
  },

  async list(query = {}) {
    return this.getAll(query.hotelId, query);
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('housekeeping')
      .select('*, rooms(room_number)')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    const task = mapHousekeepingFromDB(data);
    if (data.rooms) task.roomNumber = data.rooms.room_number;
    return task;
  },

  async getPending(hotelId) {
    return this.getAll(hotelId, { status: TASK_STATUS.PENDING });
  },

  async getInProgress(hotelId) {
    return this.getAll(hotelId, { status: TASK_STATUS.IN_PROGRESS });
  },

  async create(data) {
    const tenantId = getTenantId(data.hotelId);
    const now = new Date().toISOString();
    
    const task = {
      tenant_id: tenantId,
      room_id: data.roomId || null,
      task_type: data.type || TASK_TYPE.CLEANING,
      status: data.status || TASK_STATUS.PENDING,
      priority: data.priority || TASK_PRIORITY.MEDIUM,
      assigned_to: data.assignedTo || null,
      notes: data.description || data.notes || '',
      created_at: now,
      updated_at: now,
    };

    const { data: created, error } = await supabase
      .from('housekeeping')
      .insert(task)
      .select('*, rooms(room_number)')
      .single();
    
    if (error) throw error;
    
    const mapped = mapHousekeepingFromDB(created);
    if (created.rooms) mapped.roomNumber = created.rooms.room_number;
    return mapped;
  },

  async update(id, data) {
    const updates = { updated_at: new Date().toISOString() };
    
    if (data.status) updates.status = data.status;
    if (data.priority) updates.priority = data.priority;
    if (data.assignedTo !== undefined) updates.assigned_to = data.assignedTo;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.description !== undefined) updates.notes = data.description;
    
    const { data: updated, error } = await supabase
      .from('housekeeping')
      .update(updates)
      .eq('id', id)
      .select('*, rooms(room_number)')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    const mapped = mapHousekeepingFromDB(updated);
    if (updated.rooms) mapped.roomNumber = updated.rooms.room_number;
    return mapped;
  },

  async start(id, assignedTo = null, hotelId = null) {
    return this.update(id, {
      status: TASK_STATUS.IN_PROGRESS,
      assignedTo
    });
  },

  async complete(id, notes = '') {
    return this.update(id, {
      status: TASK_STATUS.COMPLETED,
      notes
    });
  },

  async assign(id, assignedTo) {
    return this.update(id, { assignedTo });
  },

  async remove(id) {
    const { data, error } = await supabase
      .from('housekeeping')
      .delete()
      .eq('id', id)
      .select('*, rooms(room_number)')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    const mapped = mapHousekeepingFromDB(data);
    if (data.rooms) mapped.roomNumber = data.rooms.room_number;
    return mapped;
  },

  async getStats(hotelId) {
    const tasks = await this.getAll(hotelId);
    
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === TASK_STATUS.PENDING).length,
      inProgress: tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length,
      completed: tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length,
      verified: tasks.filter(t => t.status === TASK_STATUS.VERIFIED).length,
      highPriority: tasks.filter(t => t.priority === TASK_PRIORITY.HIGH || t.priority === TASK_PRIORITY.URGENT).length
    };
  }
};
