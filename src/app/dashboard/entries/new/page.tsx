'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Vehicle, TankProfile } from '@/types';
import { formatNumber } from '@/lib/number';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function NewEntryPage() {
  return (
    <ProtectedRoute>
      <EntryForm />
    </ProtectedRoute>
  );
}

function EntryForm() {
  const router = useRouter();
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tanks, setTanks] = useState<TankProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    vehicleId: 0,
    tankProfileId: undefined as number | undefined,
    entryDate: new Date().toISOString().split('T')[0],
    odometerKm: '',
    fuelVolumeL: '',
    totalCost: '',
    currency: 'USD',
    fuelType: 'GASOLINE' as 'GASOLINE' | 'DIESEL' | 'ELECTRIC',
    fillLevel: 'FULL' as 'FULL' | 'PARTIAL',
    location: '',
    notes: '',
  });

  useEffect(() => {
    loadVehicles();
  }, [token]);

  useEffect(() => {
    if (formData.vehicleId && token) {
      loadTanks(formData.vehicleId);
    }
  }, [formData.vehicleId, token]);

  const loadVehicles = async () => {
    if (!token) return;
    
    try {
      const { vehicles: vehicleList } = await api.vehicles.list(token);
      setVehicles(vehicleList);
      if (vehicleList.length > 0) {
        setFormData(prev => ({ ...prev, vehicleId: vehicleList[0].id }));
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  };

  const loadTanks = async (vehicleId: number) => {
    if (!token) return;
    
    try {
      const vehicleData = await api.vehicles.get(vehicleId, token);
      setTanks(vehicleData.vehicle?.tanks || []);
    } catch (error) {
      console.error('Failed to load tanks:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const payload: any = {
        entryDate: new Date(formData.entryDate).toISOString(),
        odometerKm: parseFloat(formData.odometerKm),
        fuelVolumeL: parseFloat(formData.fuelVolumeL),
        totalCost: parseFloat(formData.totalCost),
        currency: formData.currency,
        fuelType: formData.fuelType,
        fillLevel: formData.fillLevel,
      };

      if (formData.tankProfileId) payload.tankProfileId = formData.tankProfileId;
      if (formData.location) payload.location = formData.location;
      if (formData.notes) payload.notes = formData.notes;

      await api.entries.create(formData.vehicleId, payload, token);
      router.push('/dashboard/entries');
    } catch (err: any) {
      setError(err.message || 'Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  if (vehicles.length === 0) {
    return (
      <div className="empty-state">
        <p>Please add a vehicle first.</p>
      </div>
    );
  }

  const pricePerLiter = formData.fuelVolumeL && formData.totalCost 
    ? formatNumber(parseFloat(formData.totalCost) / parseFloat(formData.fuelVolumeL), 3)
    : '0.000';

  return (
    <div className="form-page">
      <div className="form-container">
        <h1>Add Fill-Up Entry (Manual)</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="vehicleId">Vehicle *</label>
            <select
              id="vehicleId"
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: parseInt(e.target.value) })}
              required
            >
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
          </div>

          {tanks.length > 0 && (
            <div className="form-group">
              <label htmlFor="tankProfileId">Tank (Optional)</label>
              <select
                id="tankProfileId"
                value={formData.tankProfileId || ''}
                onChange={(e) => setFormData({ ...formData, tankProfileId: e.target.value ? parseInt(e.target.value) : undefined })}
              >
                <option value="">No specific tank</option>
                {tanks.map(tank => (
                  <option key={tank.id} value={tank.id}>
                    {tank.name} ({tank.capacityL}L)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="entryDate">Date *</label>
              <input
                id="entryDate"
                type="date"
                value={formData.entryDate}
                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="odometerKm">Odometer (km) *</label>
              <input
                id="odometerKm"
                type="number"
                step="0.1"
                value={formData.odometerKm}
                onChange={(e) => setFormData({ ...formData, odometerKm: e.target.value })}
                placeholder="12345.6"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fuelVolumeL">Volume (L) *</label>
              <input
                id="fuelVolumeL"
                type="number"
                step="0.01"
                value={formData.fuelVolumeL}
                onChange={(e) => setFormData({ ...formData, fuelVolumeL: e.target.value })}
                placeholder="45.5"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="totalCost">Total Cost *</label>
              <input
                id="totalCost"
                type="number"
                step="0.01"
                value={formData.totalCost}
                onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
                placeholder="65.75"
                required
              />
            </div>
          </div>

          <div className="calculation-display">
            <strong>Price per Liter:</strong> ${pricePerLiter}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="currency">Currency *</label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                required
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fuelType">Fuel Type *</label>
              <select
                id="fuelType"
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as any })}
                required
              >
                <option value="GASOLINE">Gasoline</option>
                <option value="DIESEL">Diesel</option>
                <option value="ELECTRIC">Electric</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fillLevel">Fill Level *</label>
              <select
                id="fillLevel"
                value={formData.fillLevel}
                onChange={(e) => setFormData({ ...formData, fillLevel: e.target.value as any })}
                required
              >
                <option value="FULL">Full</option>
                <option value="PARTIAL">Partial</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Shell Station, Main St"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Entry'}
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
