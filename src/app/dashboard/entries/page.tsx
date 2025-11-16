'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { FillUpEntry, Vehicle } from '@/types';
import { formatNumber } from '@/lib/number';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function EntriesPage() {
  return (
    <ProtectedRoute>
      <EntriesContent />
    </ProtectedRoute>
  );
}

function EntriesContent() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [entries, setEntries] = useState<FillUpEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, [token]);

  useEffect(() => {
    if (selectedVehicleId && token) {
      loadEntries(selectedVehicleId);
    }
  }, [selectedVehicleId, token]);

  const loadVehicles = async () => {
    if (!token) return;
    
    try {
      const { vehicles: vehicleList } = await api.vehicles.list(token);
      setVehicles(vehicleList);
      if (vehicleList.length > 0) {
        setSelectedVehicleId(vehicleList[0].id);
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async (vehicleId: number) => {
    if (!token) return;
    
    try {
      const { entries: entryList } = await api.entries.list(vehicleId, token);
      setEntries(entryList);
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || !selectedVehicleId) return;
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await api.entries.delete(selectedVehicleId, id, token);
      setEntries(entries.filter(e => e.id !== id));
    } catch (error) {
      console.error('Failed to delete entry:', error);
      alert('Failed to delete entry');
    }
  };

  if (loading) {
    return <div className="loading">Loading entries...</div>;
  }

  if (vehicles.length === 0) {
    return (
      <div className="empty-state">
        <p>Please add a vehicle first.</p>
        <Link href="/dashboard/vehicles/new" className="btn-primary">
          Add Vehicle
        </Link>
      </div>
    );
  }

  return (
    <div className="entries-page">
      <div className="page-header">
        <h1>Fill-Up Entries</h1>
        <div className="header-actions">
          <select
            value={selectedVehicleId || ''}
            onChange={(e) => setSelectedVehicleId(parseInt(e.target.value))}
            className="vehicle-selector"
          >
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name}
              </option>
            ))}
          </select>
          <Link href="/dashboard/entries/new" className="btn-primary">
            ➕ Manual Entry
          </Link>
          <Link href="/dashboard/entries/photo" className="btn-primary">
            📸 Photo Entry
          </Link>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <p>No entries yet for this vehicle.</p>
        </div>
      ) : (
        <div className="entries-table-container">
          <table className="entries-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Fuel Type</th>
                <th>Volume</th>
                <th>Cost</th>
                <th>Odometer</th>
                <th>Economy</th>
                <th>Fill Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td>{new Date(entry.entryDate).toLocaleDateString()}</td>
                  <td>{entry.fuelType}</td>
                  <td>{formatNumber(entry.fuelVolumeL, 2)} L</td>
                  <td>{entry.currency} ${formatNumber(entry.totalCost, 2)}</td>
                  <td>{formatNumber(entry.odometerKm, 0)} km</td>
                  <td>
                    {entry.economyLPer100Km 
                      ? `${formatNumber(entry.economyLPer100Km, 2)} L/100km` 
                      : '-'}
                  </td>
                  <td>
                    <span className={`badge badge-${entry.fillLevel.toLowerCase()}`}>
                      {entry.fillLevel}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDelete(entry.id)} 
                      className="btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
