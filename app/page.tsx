'use client';

import { useState } from 'react';

export default function HomePage() {
  const [title, setTitle] = useState('What\'s your favorite programming language?');
  const [options, setOptions] = useState(['JavaScript', 'Python', 'TypeScript', 'Go']);
  const [type, setType] = useState<'single' | 'multi'>('single');
  const [maxChoices, setMaxChoices] = useState(1);
  const [visibility, setVisibility] = useState<'pay_to_view' | 'public' | 'reveal_after_n_votes'>('pay_to_view');
  const [revealAfterVotes, setRevealAfterVotes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ slug: string; adminUrl: string } | null>(null);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/poll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          options: options.filter(opt => opt.trim()),
          type,
          max_choices: type === 'single' ? 1 : maxChoices,
          visibility,
          reveal_after_n_votes: visibility === 'reveal_after_n_votes' ? revealAfterVotes : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const shareUrl = `${window.location.origin}/poll/${result.slug}`;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Poll Created Successfully! 🎉</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share this link with voters:
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
              Admin link (save this - you can't recover it):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={result.adminUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
              <button
                onClick={() => navigator.clipboard.writeText(result.adminUrl)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={() => setResult(null)}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Create Another Poll
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Create Your Poll</h2>
        <p className="text-lg text-gray-600">
          Create anonymous polls and charge $1 for viewers to see the results
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Poll Question
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What would you like to ask?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options
          </label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  required
                  maxLength={200}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Option ${index + 1}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md"
              >
                + Add Option
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voting Type
            </label>
            <select
              value={type}
              onChange={(e) => {
                const newType = e.target.value as 'single' | 'multi';
                setType(newType);
                if (newType === 'single') {
                  setMaxChoices(1);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="single">Single Choice</option>
              <option value="multi">Multiple Choice</option>
            </select>
          </div>

          {type === 'multi' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Choices
              </label>
              <input
                type="number"
                value={maxChoices}
                onChange={(e) => setMaxChoices(parseInt(e.target.value))}
                min={2}
                max={options.length}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Results Visibility
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="visibility"
                value="pay_to_view"
                checked={visibility === 'pay_to_view'}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="mr-2"
              />
              Pay $1 to view results
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={visibility === 'public'}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="mr-2"
              />
              Results always visible (free)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="visibility"
                value="reveal_after_n_votes"
                checked={visibility === 'reveal_after_n_votes'}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="mr-2"
              />
              Reveal after
              <input
                type="number"
                value={revealAfterVotes}
                onChange={(e) => setRevealAfterVotes(parseInt(e.target.value))}
                min={1}
                max={1000}
                className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded"
              />
              votes
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Creating Poll...' : 'Create Poll'}
        </button>
      </form>
    </div>
  );
}