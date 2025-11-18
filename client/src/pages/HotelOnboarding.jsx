import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './HotelOnboarding.css';

const HotelOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    hotelInfo: {
      name: '',
      code: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      contact: {
        phone: '',
        email: '',
        website: ''
      },
      gstNumber: '',
      status: 'trial'
    },
    // Step 2: Property Structure
    floors: [],
    // Step 3: Room Types
    roomTypes: [],
    // Step 4: Pricing & GST
    pricing: {
      currency: 'INR',
      defaultCheckIn: '14:00',
      defaultCheckOut: '11:00'
    },
    // Step 5: Admin User
    admin: {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const totalSteps = 5;

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.hotelInfo.name) newErrors.name = 'Hotel name is required';
        if (!formData.hotelInfo.code) newErrors.code = 'Hotel code is required';
        if (!formData.hotelInfo.contact.email) newErrors.email = 'Email is required';
        if (!formData.hotelInfo.contact.phone) newErrors.phone = 'Phone is required';
        break;

      case 2:
        if (formData.floors.length === 0) {
          newErrors.floors = 'Please add at least one floor';
        }
        break;

      case 3:
        if (formData.roomTypes.length === 0) {
          newErrors.roomTypes = 'Please add at least one room type';
        }
        break;

      case 5:
        if (!formData.admin.username) newErrors.adminUsername = 'Username is required';
        if (!formData.admin.email) newErrors.adminEmail = 'Email is required';
        if (!formData.admin.password) newErrors.adminPassword = 'Password is required';
        if (formData.admin.password !== formData.admin.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setLoading(true);
    try {
      const response = await api.post('/hotels/onboard', formData);
      
      if (response.data.success) {
        alert('Hotel onboarded successfully!');
        navigate('/hotels');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to onboard hotel');
    } finally {
      setLoading(false);
    }
  };

  const addFloor = () => {
    const floorNumber = formData.floors.length;
    const floorName = floorNumber === 0 ? 'Ground Floor' : `Floor ${floorNumber}`;
    
    setFormData(prev => ({
      ...prev,
      floors: [...prev.floors, {
        name: floorName,
        number: floorNumber
      }]
    }));
  };

  const removeFloor = (index) => {
    setFormData(prev => ({
      ...prev,
      floors: prev.floors.filter((_, i) => i !== index)
    }));
  };

  const addRoomType = () => {
    setFormData(prev => ({
      ...prev,
      roomTypes: [...prev.roomTypes, {
        name: '',
        baseRate: '',
        occupancy: { min: 1, max: 2 },
        amenities: []
      }]
    }));
  };

  const removeRoomType = (index) => {
    setFormData(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.filter((_, i) => i !== index)
    }));
  };

  const updateRoomType = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.map((rt, i) => 
        i === index ? { ...rt, [field]: value } : rt
      )
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>Basic Hotel Information</h2>
            
            <div className="form-group">
              <label>Hotel Name *</label>
              <input
                type="text"
                value={formData.hotelInfo.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  hotelInfo: { ...prev.hotelInfo, name: e.target.value }
                }))}
                placeholder="e.g., Grand Palace Hotel"
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Hotel Code *</label>
              <input
                type="text"
                value={formData.hotelInfo.code}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  hotelInfo: { ...prev.hotelInfo, code: e.target.value.toUpperCase() }
                }))}
                placeholder="e.g., GPH001"
              />
              {errors.code && <span className="error">{errors.code}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.hotelInfo.contact.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    hotelInfo: {
                      ...prev.hotelInfo,
                      contact: { ...prev.hotelInfo.contact, email: e.target.value }
                    }
                  }))}
                  placeholder="hotel@example.com"
                />
                {errors.email && <span className="error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  value={formData.hotelInfo.contact.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    hotelInfo: {
                      ...prev.hotelInfo,
                      contact: { ...prev.hotelInfo.contact, phone: e.target.value }
                    }
                  }))}
                  placeholder="+91 1234567890"
                />
                {errors.phone && <span className="error">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>GST Number</label>
              <input
                type="text"
                value={formData.hotelInfo.gstNumber}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  hotelInfo: { ...prev.hotelInfo, gstNumber: e.target.value.toUpperCase() }
                }))}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>

            <div className="form-group">
              <label>Street Address</label>
              <input
                type="text"
                value={formData.hotelInfo.address.street}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  hotelInfo: {
                    ...prev.hotelInfo,
                    address: { ...prev.hotelInfo.address, street: e.target.value }
                  }
                }))}
                placeholder="123 Main Street"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.hotelInfo.address.city}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    hotelInfo: {
                      ...prev.hotelInfo,
                      address: { ...prev.hotelInfo.address, city: e.target.value }
                    }
                  }))}
                  placeholder="Mumbai"
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={formData.hotelInfo.address.state}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    hotelInfo: {
                      ...prev.hotelInfo,
                      address: { ...prev.hotelInfo.address, state: e.target.value }
                    }
                  }))}
                  placeholder="Maharashtra"
                />
              </div>

              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={formData.hotelInfo.address.pincode}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    hotelInfo: {
                      ...prev.hotelInfo,
                      address: { ...prev.hotelInfo.address, pincode: e.target.value }
                    }
                  }))}
                  placeholder="400001"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2>Property Structure</h2>
            <p>Define the floors in your hotel</p>

            <button type="button" onClick={addFloor} className="btn-add">
              + Add Floor
            </button>

            {errors.floors && <span className="error">{errors.floors}</span>}

            <div className="floors-list">
              {formData.floors.map((floor, index) => (
                <div key={index} className="floor-item">
                  <input
                    type="text"
                    value={floor.name}
                    onChange={(e) => {
                      const newFloors = [...formData.floors];
                      newFloors[index].name = e.target.value;
                      setFormData(prev => ({ ...prev, floors: newFloors }));
                    }}
                    placeholder="Floor name"
                  />
                  <span className="floor-number">Floor #{floor.number}</span>
                  <button 
                    type="button" 
                    onClick={() => removeFloor(index)}
                    className="btn-remove"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2>Room Types & Pricing</h2>
            <p>Configure your room categories</p>

            <button type="button" onClick={addRoomType} className="btn-add">
              + Add Room Type
            </button>

            {errors.roomTypes && <span className="error">{errors.roomTypes}</span>}

            <div className="room-types-list">
              {formData.roomTypes.map((roomType, index) => (
                <div key={index} className="room-type-card">
                  <div className="card-header">
                    <h3>Room Type {index + 1}</h3>
                    <button 
                      type="button" 
                      onClick={() => removeRoomType(index)}
                      className="btn-remove-small"
                    >
                      ×
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Room Type Name</label>
                    <input
                      type="text"
                      value={roomType.name}
                      onChange={(e) => updateRoomType(index, 'name', e.target.value)}
                      placeholder="e.g., Deluxe, Suite, Standard"
                    />
                  </div>

                  <div className="form-group">
                    <label>Base Rate (₹ per night)</label>
                    <input
                      type="number"
                      value={roomType.baseRate}
                      onChange={(e) => updateRoomType(index, 'baseRate', e.target.value)}
                      placeholder="2500"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Min Occupancy</label>
                      <input
                        type="number"
                        value={roomType.occupancy.min}
                        onChange={(e) => updateRoomType(index, 'occupancy', {
                          ...roomType.occupancy,
                          min: parseInt(e.target.value)
                        })}
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label>Max Occupancy</label>
                      <input
                        type="number"
                        value={roomType.occupancy.max}
                        onChange={(e) => updateRoomType(index, 'occupancy', {
                          ...roomType.occupancy,
                          max: parseInt(e.target.value)
                        })}
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h2>Configuration & Policies</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Default Check-in Time</label>
                <input
                  type="time"
                  value={formData.pricing.defaultCheckIn}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    pricing: { ...prev.pricing, defaultCheckIn: e.target.value }
                  }))}
                />
              </div>

              <div className="form-group">
                <label>Default Check-out Time</label>
                <input
                  type="time"
                  value={formData.pricing.defaultCheckOut}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    pricing: { ...prev.pricing, defaultCheckOut: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div className="info-box">
              <h4>GST Rates (Auto-calculated based on room price)</h4>
              <ul>
                <li>Below ₹1,000: 0% GST</li>
                <li>₹1,000 - ₹2,499: 12% GST</li>
                <li>₹2,500 - ₹7,499: 18% GST</li>
                <li>₹7,500 and above: 28% GST</li>
              </ul>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <h2>Create Hotel Admin Account</h2>

            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                value={formData.admin.username}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  admin: { ...prev.admin, username: e.target.value }
                }))}
                placeholder="admin"
              />
              {errors.adminUsername && <span className="error">{errors.adminUsername}</span>}
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.admin.email}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  admin: { ...prev.admin, email: e.target.value }
                }))}
                placeholder="admin@hotel.com"
              />
              {errors.adminEmail && <span className="error">{errors.adminEmail}</span>}
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                value={formData.admin.password}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  admin: { ...prev.admin, password: e.target.value }
                }))}
                placeholder="••••••••"
              />
              {errors.adminPassword && <span className="error">{errors.adminPassword}</span>}
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                value={formData.admin.confirmPassword}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  admin: { ...prev.admin, confirmPassword: e.target.value }
                }))}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="hotel-onboarding">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Hotel Onboarding</h1>
          <div className="progress-bar">
            {[1, 2, 3, 4, 5].map(step => (
              <div 
                key={step} 
                className={`progress-step ${step <= currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
              >
                <div className="step-number">{step}</div>
                <div className="step-label">
                  {step === 1 && 'Basic Info'}
                  {step === 2 && 'Structure'}
                  {step === 3 && 'Room Types'}
                  {step === 4 && 'Configuration'}
                  {step === 5 && 'Admin User'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="onboarding-body">
          {renderStepContent()}
        </div>

        <div className="onboarding-footer">
          <button 
            type="button" 
            onClick={handlePrevious} 
            disabled={currentStep === 1}
            className="btn-secondary"
          >
            Previous
          </button>

          {currentStep < totalSteps ? (
            <button 
              type="button" 
              onClick={handleNext}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSubmit}
              disabled={loading}
              className="btn-success"
            >
              {loading ? 'Creating Hotel...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelOnboarding;
