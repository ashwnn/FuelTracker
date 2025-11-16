'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Vehicle, FillUpEntry, BudgetUsage } from '@/types';
import { formatNumber } from '@/lib/number';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [budgetUsage, setBudgetUsage] = useState<BudgetUsage | null>(null);
  const [lastEntries, setLastEntries] = useState<Record<number, FillUpEntry>>({});
  const [loading, setLoading] = useState(true);
  const [vehicleCollapsed, setVehicleCollapsed] = useState(false);
  const [lastFillCollapsed, setLastFillCollapsed] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  const loadDashboardData = async () => {
    if (!token) return;
    
    try {
      // Use consolidated dashboard endpoint for better performance
      const data = await api.dashboard.getInitialData(token);
      
      setVehicles(data.vehicles);
      setBudgetUsage(data.budgetUsage);
      setLastEntries(data.lastEntries);
      
      // Set first vehicle as selected
      if (data.vehicles.length > 0) {
        setSelectedVehicle(data.vehicles[0]);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
``
  // Handle vehicle selection change
  const handleVehicleChange = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    setSelectedVehicle(vehicle || null);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (vehicles.length === 0) {
    return (
      <div className="empty-state">
        <h2>Welcome to FuelTracker!</h2>
        <p>Get started by adding your first vehicle.</p>
        <Link href="/dashboard/vehicles/new" className="btn-primary">
          Add Vehicle
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      {/* Quick Actions - First for mobile-first design */}
      <div className="card quick-actions">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <Link href="/dashboard/entries/new" className="quick-action-btn" title="Add Fill-Up (Manual)">
            <span className="quick-action-icon">➕</span>
            <span className="quick-action-label">Manual</span>
          </Link>
          <Link href="/dashboard/entries/photo" className="quick-action-btn" title="Add Fill-Up (Photo)">
            <span className="quick-action-icon">📸</span>
            <span className="quick-action-label">Photo</span>
          </Link>
          <Link href="/dashboard/analytics" className="quick-action-btn" title="View Analytics">
            <span className="quick-action-icon">📊</span>
            <span className="quick-action-label">Analytics</span>
          </Link>
        </div>
      </div>

      {/* Budget - Under Quick Actions */}
      <div className="card">
        <h2>Monthly Budget</h2>
        {budgetUsage?.budget ? (
          <div className="budget-widget">
            <p><strong>Monthly Budget:</strong> {budgetUsage.budget.currency} ${formatNumber(budgetUsage.budget.amount, 2)}</p>
            <p><strong>Spent This Month:</strong> ${formatNumber(budgetUsage.totalSpent, 2)}</p>
            {budgetUsage.percentUsed !== undefined && (
              <>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.min(budgetUsage.percentUsed, 100)}%`,
                      backgroundColor: budgetUsage.percentUsed > 100 ? '#ef4444' : budgetUsage.percentUsed > 80 ? '#f59e0b' : '#10b981'
                    }}
                  ></div>
                </div>
                <p className={budgetUsage.percentUsed > 100 ? 'text-danger' : ''}>
                  {formatNumber(budgetUsage.percentUsed, 1)}% used this month
                </p>
              </>
            )}
            <p className="budget-note">This budget applies to every month.</p>
          </div>
        ) : (
          <div>
            <p>No monthly budget set yet.</p>
            <p className="budget-help">Set a monthly budget in settings to track your fuel spending.</p>
            <Link href="/dashboard/settings" className="btn-secondary">Set Budget</Link>
          </div>
        )}
      </div>

      {/* Stats */}
      {selectedVehicle?.stats && (
        <div className="card">
          <h2>Vehicle Stats</h2>
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-label">Total Entries</div>
              <div className="stat-value">{selectedVehicle.stats.entryCount}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Total Fuel</div>
              <div className="stat-value">{formatNumber(selectedVehicle.stats.totalFuelL, 1)} L</div>
            </div>
            <div className="stat">
              <div className="stat-label">Total Cost</div>
              <div className="stat-value">${formatNumber(selectedVehicle.stats.totalCost, 2)}</div>
            </div>
            {selectedVehicle.stats.avgEconomyLPer100Km && (
              <div className="stat">
                <div className="stat-label">Avg Economy</div>
                <div className="stat-value">{formatNumber(selectedVehicle.stats.avgEconomyLPer100Km, 2)} L/100km</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vehicle Selector - Collapsible */}
      <div className="card collapsible-card">
        <div className="card-header-collapsible">
          <h2>Selected Vehicle</h2>
          <button 
            className="collapse-btn"
            onClick={() => setVehicleCollapsed(!vehicleCollapsed)}
            aria-label={vehicleCollapsed ? 'Expand' : 'Collapse'}
          >
            {vehicleCollapsed ? '▶️' : '▼'}
          </button>
        </div>
        {!vehicleCollapsed && (
          <div className="card-content">
            <select
              value={selectedVehicle?.id || ''}
              onChange={(e) => handleVehicleChange(parseInt(e.target.value))}
              className="vehicle-selector"
            >
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} {vehicle.make && `- ${vehicle.make} ${vehicle.model}`}
                </option>
              ))}
            </select>
            <Link href="/dashboard/vehicles" className="btn-secondary" style={{ marginTop: '1rem' }}>
              Manage Vehicles
            </Link>
          </div>
        )}
      </div>

      {/* Last Fill - Collapsible */}
      {selectedVehicle && (
        <div className="card collapsible-card">
          <div className="card-header-collapsible">
            <h2>Last Fill-Up</h2>
            <button 
              className="collapse-btn"
              onClick={() => setLastFillCollapsed(!lastFillCollapsed)}
              aria-label={lastFillCollapsed ? 'Expand' : 'Collapse'}
            >
              {lastFillCollapsed ? '▶️' : '▼'}
            </button>
          </div>
          {!lastFillCollapsed && (
            <div className="card-content">
              {selectedVehicle && lastEntries[selectedVehicle.id] ? (
                <div className="last-fill">
                  {(() => {
                    const entry = lastEntries[selectedVehicle.id];
                    return (
                      <>
                        <p><strong>Date:</strong> {new Date(entry.entryDate).toLocaleDateString()}</p>
                        <p><strong>Fuel Type:</strong> {entry.fuelType}</p>
                        <p><strong>Volume:</strong> {formatNumber(entry.fuelVolumeL, 2)} L</p>
                        <p><strong>Cost:</strong> {entry.currency} ${formatNumber(entry.totalCost, 2)}</p>
                        {entry.economyLPer100Km && (
                          <p><strong>Economy:</strong> {formatNumber(entry.economyLPer100Km, 2)} L/100km</p>
                        )}
                        {entry.fillLevel === 'PARTIAL' && (
                          <span className="badge">Partial Fill</span>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <p>No entries yet for this vehicle.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
