'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { MonthlyBudget } from '@/types';
import { formatNumber } from '@/lib/number';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'budgets' | 'apikeys' | 'export'>('budgets');

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      
      <div className="settings-tabs">
        <button 
          className={activeTab === 'budgets' ? 'tab-active' : ''}
          onClick={() => setActiveTab('budgets')}
        >
          Budgets
        </button>
        <button 
          className={activeTab === 'apikeys' ? 'tab-active' : ''}
          onClick={() => setActiveTab('apikeys')}
        >
          API Keys
        </button>
        <button 
          className={activeTab === 'export' ? 'tab-active' : ''}
          onClick={() => setActiveTab('export')}
        >
          Export Data
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'budgets' && <BudgetSettings token={token} />}
        {activeTab === 'apikeys' && <ApiKeySettings token={token} />}
        {activeTab === 'export' && <ExportSettings token={token} />}
      </div>
    </div>
  );
}

function BudgetSettings({ token }: { token: string | null }) {
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
  });

  useEffect(() => {
    loadBudget();
  }, [token]);

  const loadBudget = async () => {
    if (!token) return;
    
    try {
      const { budget: userBudget } = await api.budgets.get(token);
      setBudget(userBudget);
      if (userBudget) {
        setFormData({
          amount: userBudget.amount.toString(),
          currency: userBudget.currency,
        });
      }
    } catch (error) {
      console.error('Failed to load budget:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      await api.budgets.create({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
      }, token);
      
      await loadBudget();
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !confirm('Are you sure you want to delete your monthly budget?')) return;

    setLoading(true);
    setError('');

    try {
      await api.budgets.delete(token);
      setBudget(null);
      setFormData({ amount: '', currency: 'USD' });
    } catch (err: any) {
      setError(err.message || 'Failed to delete budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Monthly Budget</h2>
        {budget ? (
          <button 
            className="btn-secondary" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '✏️ Edit Budget'}
          </button>
        ) : (
          <button 
            className="btn-primary" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '➕ Set Budget'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {budget && !showForm && (
        <div className="budget-display">
          <p className="budget-info">
            Your monthly budget is set to <strong>{budget.currency} ${formatNumber(budget.amount, 2)}</strong> every month.
          </p>
          <p className="budget-note">
            This budget applies to all months. You can track your spending against this budget on the dashboard.
          </p>
          <button onClick={handleDelete} className="btn-danger" disabled={loading}>
            Delete Budget
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="budget-form">
          <div className="form-group">
            <label htmlFor="amount">Monthly Budget Amount</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="500.00"
              required
            />
            <p className="form-help">This amount will be your budget for every month.</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="currency">Currency</label>
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

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : budget ? 'Update Budget' : 'Set Budget'}
          </button>
        </form>
      )}

      {!budget && !showForm && (
        <p>No monthly budget set. Set a budget to track your fuel spending each month.</p>
      )}
    </div>
  );
}

function ApiKeySettings({ token }: { token: string | null }) {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  useEffect(() => {
    loadApiKeys();
  }, [token]);

  const loadApiKeys = async () => {
    if (!token) return;
    
    try {
      const { apiKeys: keyList } = await api.apiKeys.list(token);
      setApiKeys(keyList);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const result = await api.apiKeys.create(newKeyName, token);
      setGeneratedKey(result.apiKey.key);
      await loadApiKeys();
      setNewKeyName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!token) return;
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return;

    try {
      await api.apiKeys.revoke(id, token);
      await loadApiKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      alert('Failed to revoke API key');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>API Keys</h2>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '➕ Generate Key'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {generatedKey && (
        <div className="success-message">
          <p><strong>API Key Generated!</strong></p>
          <p>Copy this key now. It will not be shown again.</p>
          <code className="generated-key">{generatedKey}</code>
          <button 
            className="btn-secondary" 
            onClick={() => {
              navigator.clipboard.writeText(generatedKey);
              alert('Copied to clipboard!');
            }}
          >
            📋 Copy
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => setGeneratedKey('')}
          >
            Close
          </button>
        </div>
      )}

      {showForm && !generatedKey && (
        <form onSubmit={handleCreate} className="api-key-form">
          <div className="form-group">
            <label htmlFor="keyName">Key Name</label>
            <input
              id="keyName"
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="My Integration"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Key'}
          </button>
        </form>
      )}

      {apiKeys.length === 0 ? (
        <p>No API keys generated yet.</p>
      ) : (
        <table className="settings-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created</th>
              <th>Last Used</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.map(key => (
              <tr key={key.id}>
                <td>{key.name}</td>
                <td>{new Date(key.createdAt).toLocaleDateString()}</td>
                <td>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</td>
                <td>
                  <button 
                    onClick={() => handleRevoke(key.id)} 
                    className="btn-danger btn-sm"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ExportSettings({ token }: { token: string | null }) {
  const [loading, setLoading] = useState(false);

  const handleExportJson = async () => {
    if (!token) return;
    setLoading(true);
    
    try {
      const data = await api.export.json(token);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fueltracker-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export JSON:', error);
      alert('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    if (!token) return;
    setLoading(true);
    
    try {
      const response = await api.export.csv(token);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fueltracker-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Export Your Data</h2>
      <p>Download all your fuel tracking data in JSON or CSV format.</p>

      <div className="export-buttons">
        <button 
          className="btn-primary" 
          onClick={handleExportJson}
          disabled={loading}
        >
          {loading ? 'Exporting...' : '📥 Export as JSON'}
        </button>
        <button 
          className="btn-primary" 
          onClick={handleExportCsv}
          disabled={loading}
        >
          {loading ? 'Exporting...' : '📥 Export as CSV'}
        </button>
      </div>

      <div className="info-box">
        <h3>Export Information:</h3>
        <ul>
          <li><strong>JSON:</strong> Complete data including all vehicles, entries, budgets, and relationships</li>
          <li><strong>CSV:</strong> Simplified entry data suitable for spreadsheet analysis</li>
        </ul>
      </div>
    </div>
  );
}
