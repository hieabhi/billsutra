import React, { useState, useEffect } from 'react';
import { itemsAPI } from '../api';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { formatCurrency } from '../utils';
import './Items.css';

const Items = () => {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Food',
    hsn: '',
    rate: '',
    cgst: 2.5,
    sgst: 2.5,
    igst: 0,
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await itemsAPI.getAll();
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await itemsAPI.update(editingItem._id, formData);
      } else {
        await itemsAPI.create(formData);
      }
      fetchItems();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    // Simplified version - just alert then delete
    alert('About to delete item...');

    try {
      console.log('Deleting item with ID:', id);
      await itemsAPI.delete(id);
      console.log('Delete successful, refreshing list...');
      fetchItems();
      alert('Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item: ' + error.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Food',
      hsn: '',
      rate: '',
      cgst: 2.5,
      sgst: 2.5,
      igst: 0,
      description: '',
      isActive: true
    });
  };

  return (
    <div className="items-page">
      <div className="page-header">
        <div>
          <h1>Items / Menu</h1>
          <p>Manage your products and services</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="card">
        {items.length === 0 ? (
          <div className="no-data">No items found. Add your first item!</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>HSN</th>
                  <th>Rate</th>
                  <th>CGST %</th>
                  <th>SGST %</th>
                  <th>IGST %</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.category}</td>
                    <td>{item.hsn || '-'}</td>
                    <td>{formatCurrency(item.rate)}</td>
                    <td>{item.cgst}%</td>
                    <td>{item.sgst}%</td>
                    <td>{item.igst}%</td>
                    <td>
                      <span className={`badge badge-${item.isActive ? 'success' : 'danger'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(item)}
                          className="btn-icon btn-primary"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="btn-icon btn-danger"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={handleCloseModal} className="btn-icon">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="Food">Food</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Room Service">Room Service</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>HSN/SAC Code</label>
                  <input
                    type="text"
                    value={formData.hsn}
                    onChange={(e) => setFormData({ ...formData, hsn: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label>Rate *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>CGST %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cgst}
                    onChange={(e) => setFormData({ ...formData, cgst: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="input-group">
                  <label>SGST %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sgst}
                    onChange={(e) => setFormData({ ...formData, sgst: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="input-group">
                  <label>IGST %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.igst}
                    onChange={(e) => setFormData({ ...formData, igst: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="input-group">
                  <label>Status</label>
                  <select
                    value={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="input-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update' : 'Add'} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
