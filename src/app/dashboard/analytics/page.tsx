'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Vehicle, FillUpEntry } from '@/types';
import { formatNumber } from '@/lib/number';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}

function AnalyticsContent() {
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

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (vehicles.length === 0) {
    return (
      <div className="empty-state">
        <p>Please add a vehicle first.</p>
      </div>
    );
  }

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  
  // Calculate analytics
  const totalCost = entries.reduce((sum, e) => sum + e.totalCost, 0);
  const totalVolume = entries.reduce((sum, e) => sum + e.fuelVolumeL, 0);
  const avgPricePerLiter = totalVolume > 0 ? totalCost / totalVolume : 0;
  
  const economyEntries = entries.filter(e => e.economyLPer100Km);
  const avgEconomy = economyEntries.length > 0
    ? economyEntries.reduce((sum, e) => sum + (e.economyLPer100Km || 0), 0) / economyEntries.length
    : 0;

  // Group by month
  const monthlyData = entries.reduce((acc, entry) => {
    const date = new Date(entry.entryDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { cost: 0, volume: 0, count: 0 };
    }
    acc[monthKey].cost += entry.totalCost;
    acc[monthKey].volume += entry.fuelVolumeL;
    acc[monthKey].count += 1;
    return acc;
  }, {} as Record<string, { cost: number; volume: number; count: number }>);

  const monthlyStats = Object.entries(monthlyData)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6);

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analytics</h1>
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
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <p>No entries yet for analytics.</p>
        </div>
      ) : (
        <div className="analytics-grid">
          {/* Overall Stats */}
          <div className="card">
            <h2>Overall Statistics</h2>
            <div className="stats-list">
              <div className="stat-row">
                <span>Total Entries:</span>
                <strong>{entries.length}</strong>
              </div>
              <div className="stat-row">
                <span>Total Spent:</span>
                <strong>${formatNumber(totalCost, 2)}</strong>
              </div>
              <div className="stat-row">
                <span>Total Fuel:</span>
                <strong>{formatNumber(totalVolume, 1)} L</strong>
              </div>
              <div className="stat-row">
                <span>Avg Price/L:</span>
                <strong>${formatNumber(avgPricePerLiter, 3)}</strong>
              </div>
              {avgEconomy > 0 && (
                <div className="stat-row">
                  <span>Avg Economy:</span>
                  <strong>{formatNumber(avgEconomy, 2)} L/100km</strong>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="card">
            <h2>Monthly Breakdown (Last 6 Months)</h2>
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Fills</th>
                  <th>Volume (L)</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map(([month, data]) => (
                  <tr key={month}>
                    <td>{month}</td>
                    <td>{data.count}</td>
                    <td>{formatNumber(data.volume, 1)}</td>
                    <td>${formatNumber(data.cost, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Economy Trend */}
          {economyEntries.length > 0 && (
            <div className="card">
              <h2>Economy Trend (Recent)</h2>
              <div className="trend-list">
                {economyEntries.slice(0, 10).map(entry => (
                  <div key={entry.id} className="trend-item">
                    <span>{new Date(entry.entryDate).toLocaleDateString()}</span>
                    <span className="trend-value">
                      {formatNumber(entry.economyLPer100Km, 2)} L/100km
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fuel Type Distribution */}
          <div className="card">
            <h2>Fuel Type Distribution</h2>
            <div className="stats-list">
              {Object.entries(
                entries.reduce((acc, e) => {
                  acc[e.fuelType] = (acc[e.fuelType] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <div key={type} className="stat-row">
                  <span>{type}:</span>
                  <strong>{count} entries ({formatNumber((count / entries.length) * 100, 1)}%)</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
