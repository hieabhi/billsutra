import supabase, { mapItemFromDB } from '../config/supabase.js';

console.log('🚀 LOADING SUPABASE ITEMSREPO');

function getTenantId(hotelId) {
  if (!hotelId) {
    throw new Error('hotelId is required for all item operations. This indicates a missing authentication context.');
  }
  return hotelId;
}

export const itemsRepo = {
  async list(query = {}) {
    const tenantId = getTenantId(query.hotelId);
    
    let supaQuery = supabase
      .from('items')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (query.category) supaQuery = supaQuery.eq('category', query.category);
    if (typeof query.isActive === 'boolean') supaQuery = supaQuery.eq('is_active', query.isActive);
    
    supaQuery = supaQuery.order('name');
    
    const { data, error } = await supaQuery;
    if (error) throw error;
    
    return (data || []).map(mapItemFromDB);
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return mapItemFromDB(data);
  },

  async create(data) {
    const tenantId = getTenantId(data.hotelId);
    const now = new Date().toISOString();
    
    const item = {
      tenant_id: tenantId,
      name: data.name,
      category: data.category || 'Food',
      hsn: data.hsn || '',
      price: Number(data.rate || data.price),
      cgst: Number(data.cgst ?? 2.5),
      sgst: Number(data.sgst ?? 2.5),
      igst: Number(data.igst ?? 0),
      description: data.description || '',
      is_active: data.isActive !== false,
      created_at: now,
      updated_at: now,
    };
    
    const { data: created, error } = await supabase
      .from('items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return mapItemFromDB(created);
  },

  async update(id, data) {
    const updates = {
      updated_at: new Date().toISOString()
    };
    
    if (data.name !== undefined) updates.name = data.name;
    if (data.category !== undefined) updates.category = data.category;
    if (data.hsn !== undefined) updates.hsn = data.hsn;
    if (data.rate !== undefined) updates.price = Number(data.rate);
    if (data.price !== undefined) updates.price = Number(data.price);
    if (data.cgst !== undefined) updates.cgst = Number(data.cgst);
    if (data.sgst !== undefined) updates.sgst = Number(data.sgst);
    if (data.igst !== undefined) updates.igst = Number(data.igst);
    if (data.description !== undefined) updates.description = data.description;
    if (data.isActive !== undefined) updates.is_active = data.isActive;
    
    const { data: updated, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return mapItemFromDB(updated);
  },

  async remove(id) {
    const { data, error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return mapItemFromDB(data);
  }
};
