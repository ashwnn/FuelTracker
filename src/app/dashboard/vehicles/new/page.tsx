'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function NewVehiclePage() {
  return (
    <ProtectedRoute>
      <VehicleForm />
    </ProtectedRoute>
  );
}

function VehicleForm() {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const payload: any = {
        name: formData.name,
      };

      if (formData.make) payload.make = formData.make;
      if (formData.model) payload.model = formData.model;
      if (formData.year) payload.year = formData.year;

      await api.vehicles.create(payload, token);
      router.push('/dashboard/vehicles');
    } catch (err: any) {
      setError(err.message || 'Failed to create vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-container">
        <h1>Add New Vehicle</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Vehicle Name *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Car"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="make">Make</label>
            <input
              id="make"
              type="text"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              placeholder="Toyota"
            />
          </div>

          <div className="form-group">
            <label htmlFor="model">Model</label>
            <input
              id="model"
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Camry"
            />
          </div>

          <div className="form-group">
            <label htmlFor="year">Year</label>
            <input
              id="year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              min="1900"
              max={new Date().getFullYear() + 1}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Vehicle'}
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
