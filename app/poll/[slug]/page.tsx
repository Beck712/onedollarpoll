'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

interface Poll {
  id: string;
  title: string;
  options: string[];
  type: 'single' | 'multi';
  max_choices: number;
  visibility: 'pay_to_view' | 'public' | 'reveal_after_n_votes';
  reveal_after_n_votes?: number;
}

interface Results {
  poll: { title: string; options: string[] };
  results: Array<{ option: string; votes: number; percentage: number }>;
  totalVotes: number;
  totalChoices: number;
}

export default function PollPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [canViewResults, setCanViewResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    fetchPoll();
    
    // Check for payment success
    if (searchParams.get('payment') === 'success') {
      // Set a reveal token cookie and check results access
      const timer = setTimeout(async () => {
        await fetchPaymentStatus();
        await checkResultsAccess();
      }, 2000); // Give webhook time to process
      return () => clearTimeout(timer);
    }
  }, [slug, searchParams]);

  const fetchPoll = async () => {
    try {
      const response = await fetch(`/api/poll/${slug}`);
      if (response.ok) {
        const pollData = await response.json();
        setPoll(pollData);
        
        // Check if user has already voted
        const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '[]');
        setHasVoted(votedPolls.includes(slug));
        
        // Check if results can be viewed
        await checkResultsAccess();
      } else {
        console.error('Poll not found');
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/poll/${slug}/payment-status`);
      if (response.ok) {
        const { reveal_token } = await response.json();
        if (reveal_token) {
          Cookies.set(`reveal_token_${slug}`, reveal_token, { expires: 30 }); // 30 days
        }
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
    }
  };

  const checkResultsAccess = async () => {
    try {
      const revealToken = Cookies.get(`reveal_token_${slug}`);
      const url = revealToken 
        ? `/api/poll/${slug}/results?reveal_token=${revealToken}`
        : `/api/poll/${slug}/results`;
        
      const response = await fetch(url);
      if (response.ok) {
        const resultsData = await response.json();
        setResults(resultsData);
        setCanViewResults(true);
      } else {
        setCanViewResults(false);
      }
    } catch (error) {
      setCanViewResults(false);
    }
  };

  const handleVote = async () => {
    if (!poll || selectedOptions.length === 0) return;

    setVoting(true);
    try {
      const response = await fetch(`/api/poll/${slug}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_options: selectedOptions }),
      });

      if (response.ok) {
        setHasVoted(true);
        
        // Remember that user voted
        const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '[]');
        votedPolls.push(slug);
        localStorage.setItem('votedPolls', JSON.stringify(votedPolls));
        
        // Check if results are now available
        await checkResultsAccess();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to record vote');
    } finally {
      setVoting(false);
    }
  };

  const handlePayForResults = async () => {
    setLoadingPayment(true);
    try {
      const response = await fetch(`/api/poll/${slug}/create-checkout`, {
        method: 'POST',
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        setLoadingPayment(false);
      }
    } catch (error) {
      alert('Failed to create payment');
      setLoadingPayment(false);
    }
  };

  const handleOptionChange = (optionIndex: number) => {
    if (!poll) return;

    if (poll.type === 'single') {
      setSelectedOptions([optionIndex]);
    } else {
      const newSelection = selectedOptions.includes(optionIndex)
        ? selectedOptions.filter(i => i !== optionIndex)
        : [...selectedOptions, optionIndex];
      
      if (newSelection.length <= poll.max_choices) {
        setSelectedOptions(newSelection);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading poll...</div>;
  }

  if (!poll) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Poll Not Found</h2>
        <p className="text-gray-600">The poll you're looking for doesn't exist.</p>
        <a href="/" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Create a new poll
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{poll.title}</h1>

        {searchParams.get('payment') === 'success' && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Payment successful! Results should be available shortly.
          </div>
        )}

        {searchParams.get('payment') === 'cancelled' && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            Payment was cancelled. You can try again anytime.
          </div>
        )}

        {!hasVoted && (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              {poll.type === 'single' 
                ? 'Select one option:' 
                : `Select up to ${poll.max_choices} options:`
              }
            </p>
            
            <div className="space-y-3">
              {poll.options.map((option, index) => (
                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type={poll.type === 'single' ? 'radio' : 'checkbox'}
                    name="poll-option"
                    checked={selectedOptions.includes(index)}
                    onChange={() => handleOptionChange(index)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-800">{option}</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleVote}
              disabled={selectedOptions.length === 0 || voting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {voting ? 'Recording Vote...' : 'Submit Vote'}
            </button>
          </div>
        )}

        {hasVoted && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            ✓ Your vote has been recorded!
          </div>
        )}
      </div>

      {canViewResults && results && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Results</h2>
          
          <div className="space-y-3 mb-4">
            {results.results.map((result, index) => (
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

      {hasVoted && !canViewResults && poll.visibility === 'pay_to_view' && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">View Results</h2>
          <p className="text-gray-600 mb-4">
            Pay $1 to see how others voted in this poll.
          </p>
          <button
            onClick={handlePayForResults}
            disabled={loadingPayment}
            className="bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {loadingPayment ? 'Processing...' : 'Pay $1 to View Results'}
          </button>
        </div>
      )}

      {hasVoted && !canViewResults && poll.visibility === 'reveal_after_n_votes' && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Results Coming Soon</h2>
          <p className="text-gray-600">
            Results will be revealed after {poll.reveal_after_n_votes} votes are collected.
          </p>
        </div>
      )}

      <div className="text-center">
        <a href="/" className="text-blue-600 hover:text-blue-800">
          Create your own poll
        </a>
      </div>
    </div>
  );
}