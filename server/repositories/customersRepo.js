import supabase, { mapCustomerFromDB } from '../config/supabase.js';

console.log('🚀 LOADING SUPABASE CUSTOMERSREPO');

function getTenantId(hotelId) {
  return hotelId;
}

export const customersRepo = {
  async list(query = {}) {
    const tenantId = getTenantId(query.hotelId);
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(mapCustomerFromDB);
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return mapCustomerFromDB(data);
  },

  async create(data) {
    const tenantId = getTenantId(data.hotelId);
    const now = new Date().toISOString();
    
    const customer = {
      tenant_id: tenantId,
      name: String(data.name || '').trim(),
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      gstin: data.gstNumber || '',
      id_proof_type: data.idProofType || null,
      id_proof_number: data.idProofNumber || null,
      created_at: now,
      updated_at: now
    };
    
    const { data: created, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();
    
    if (error) throw error;
    return mapCustomerFromDB(created);
  },

  async update(id, data) {
    const updates = { updated_at: new Date().toISOString() };
    
    if (data.name !== undefined) updates.name = String(data.name).trim();
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.email !== undefined) updates.email = data.email;
    if (data.address !== undefined) updates.address = data.address;
    if (data.gstNumber !== undefined) updates.gstin = data.gstNumber;
    if (data.idProofType !== undefined) updates.id_proof_type = data.idProofType;
    if (data.idProofNumber !== undefined) updates.id_proof_number = data.idProofNumber;
    
    const { data: updated, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return mapCustomerFromDB(updated);
  },

  async remove(id) {
    const { data, error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return mapCustomerFromDB(data);
  }
};
