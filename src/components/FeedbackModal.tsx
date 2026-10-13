import React, { useState } from 'react';
import { Star, Send, X, CheckCircle, MessageSquare } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameMetadata?: {
    totalMoves: number;
    gameStatus: string;
  };
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  gameMetadata,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<string>('Gameplay & Balance');
  const [comment, setComment] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const feedbackPayload = {
      timestamp: new Date().toISOString(),
      rating,
      category,
      comment,
      email: email || undefined,
      gameMetadata,
    };

    // 1. Store in localStorage as persistent backup
    try {
      const stored = JSON.parse(localStorage.getItem('warp_chess_feedback') || '[]');
      stored.push(feedbackPayload);
      localStorage.setItem('warp_chess_feedback', JSON.stringify(stored));
    } catch {
      // Ignore localStorage errors
    }

    // 2. Mock cloud submission latency (can be connected to Supabase / Firebase / Webhook)
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  const handleReset = () => {
    setSubmitted(false);
    setComment('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-100 mb-2">Thank you!</h3>
            <p className="text-sm text-slate-300 mb-6">
              Your feedback is recorded and will help shape Two-Layer Chess.
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm rounded-lg shadow transition-colors"
            >
              Back to Game
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-slate-100">Player Feedback</h3>
            </div>
            <p className="text-xs text-slate-400">
              Two-Layer Chess is in early idea validation. Share your thoughts on rules, balance, and fun!
            </p>

            {/* Rating */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Overall Experience
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="Gameplay & Balance">Gameplay & Balance</option>
                <option value="Warp Gates">Warp Gate Mechanics</option>
                <option value="Jump Pieces">Jump Pieces Dynamics</option>
                <option value="Controls / UX">Controls & Visuals</option>
                <option value="Bug Report">Bug Report</option>
                <option value="General Thought">General Suggestion</option>
              </select>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your Thoughts / Suggestions
              </label>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like? What felt confusing or unbalanced about Warp Gates or Jump Pieces?"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
              />
            </div>

            {/* Optional Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email (optional, for follow-up)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm rounded-lg shadow-lg transition-all active:scale-98 disabled:opacity-50"
            >
              <Send size={16} />
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
