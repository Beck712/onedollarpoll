'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface AdminData {
  poll: {
    title: string;
    options: string[];
    visibility: string;
    created_at: string;
  };
  analytics: {
    totalVotes: number;
    uniqueVoters: number;
    totalPayments: number;
    revenue: number;
    recentVotes: Array<{
      selected_options: number[];
      created_at: string;
      ip_address: string;
    }>;
  };
}

export default function AdminPage() {
  const params = useParams();
  const slug = params.slug as string;
  const token = params.token as string;

  const [data, setData] = useState<AdminData | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAdminData();
    fetchResults();
  }, []);

  const fetchAdminData = async () => {
    try {
      const response = await fetch(`/api/poll/${slug}/admin?admin_token=${token}`);
      if (response.ok) {
        const adminData = await response.json();
        setData(adminData);
      } else {
        console.error('Failed to fetch admin data');
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/poll/${slug}/results?admin_token=${token}`);
      if (response.ok) {
        const resultsData = await response.json();
        setResults(resultsData);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/poll/${slug}?admin_token=${token}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Poll deleted successfully');
        window.location.href = '/';
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to delete poll');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading admin panel...</div>;
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="text-gray-600">Invalid admin token or poll not found.</p>
        <a href="/" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Go home
        </a>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/poll/${slug}`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <h2 className="text-xl text-gray-700 mb-4">{data.poll.title}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share URL:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Copy
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poll Created:
            </label>
            <p className="px-3 py-2 bg-gray-50 rounded-md">
              {new Date(data.poll.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{data.analytics.totalVotes}</div>
            <div className="text-sm text-gray-600">Total Votes</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{data.analytics.uniqueVoters}</div>
            <div className="text-sm text-gray-600">Unique Voters</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{data.analytics.totalPayments}</div>
            <div className="text-sm text-gray-600">Payments</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">${(data.analytics.revenue / 100).toFixed(2)}</div>
            <div className="text-sm text-gray-600">Revenue</div>
          </div>
        </div>

        <div className="border-t pt-4">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400"
          >
            {deleting ? 'Deleting...' : 'Delete Poll'}
          </button>
        </div>
      </div>

      {results && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Live Results</h2>
          
          <div className="space-y-3 mb-4">
            {results.results.map((result: any, index: number) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-800">{result.option}</span>
                  <span className="text-gray-600">{result.votes} votes ({result.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${result.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-600">
            Total: {results.totalVotes} voters, {results.totalChoices} choices
          </p>
        </div>
      )}

      {data.analytics.recentVotes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {data.analytics.recentVotes.slice(0, 10).map((vote, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">
                  Options: {vote.selected_options.join(', ')}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(vote.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}