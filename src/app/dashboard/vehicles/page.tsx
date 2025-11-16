'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Vehicle } from '@/types';
import { formatNumber } from '@/lib/number';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function VehiclesPage() {
  return (
    <ProtectedRoute>
      <VehiclesContent />
    </ProtectedRoute>
  );
}

function VehiclesContent() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, [token]);

  const loadVehicles = async () => {
    if (!token) return;
    
    try {
      const { vehicles: vehicleList } = await api.vehicles.list(token);
      setVehicles(vehicleList);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this vehicle? All associated data will be removed.')) return;

    try {
      await api.vehicles.delete(id, token);
      setVehicles(vehicles.filter(v => v.id !== id));
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      alert('Failed to delete vehicle');
    }
  };

  if (loading) {
    return <div className="loading">Loading vehicles...</div>;
  }

  return (
    <div className="vehicles-page">
      <div className="page-header">
        <h1>My Vehicles</h1>
        <Link href="/dashboard/vehicles/new" className="btn-primary">
          ➕ Add Vehicle
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="empty-state">
          <p>No vehicles added yet.</p>
          <Link href="/dashboard/vehicles/new" className="btn-primary">
            Add Your First Vehicle
          </Link>
        </div>
      ) : (
        <div className="vehicles-grid">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="card vehicle-card">
              <div className="vehicle-header">
                <h2>{vehicle.name}</h2>
                {vehicle.make && (
                  <p className="vehicle-details">{vehicle.make} {vehicle.model} {vehicle.year}</p>
                )}
              </div>

              {vehicle.stats && (
                <div className="vehicle-stats">
                  <div className="stat-row">
                    <span>Entries:</span>
                    <strong>{vehicle.stats.entryCount}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Total Fuel:</span>
                    <strong>{formatNumber(vehicle.stats.totalFuelL, 1)} L</strong>
                  </div>
                  <div className="stat-row">
                    <span>Total Cost:</span>
                    <strong>${formatNumber(vehicle.stats.totalCost, 2)}</strong>
                  </div>
                  {vehicle.stats.avgEconomyLPer100Km && (
                    <div className="stat-row">
                      <span>Avg Economy:</span>
                      <strong>{formatNumber(vehicle.stats.avgEconomyLPer100Km, 2)} L/100km</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="vehicle-actions">
                <Link href={`/dashboard/vehicles/${vehicle.id}/edit`} className="btn-secondary">
                  Edit
                </Link>
                <button onClick={() => handleDelete(vehicle.id)} className="btn-danger">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
