import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import {
  ThumbsUp, ThumbsDown, MessageSquare, Star, X,
  CheckCircle, Loader2
} from 'lucide-react';

const SUBMIT_FEEDBACK = gql`
  mutation SubmitFeedback($userId: ID!, $messageId: ID!, $rating: Int!, $category: FeedbackCategory, $comment: String, $wasHelpful: Boolean!) {
    submitFeedback(userId: $userId, messageId: $messageId, rating: $rating, category: $category, comment: $comment, wasHelpful: $wasHelpful) {
      id rating wasHelpful
    }
  }
`;
const QUICK_FEEDBACK = gql`
  mutation QuickFeedback($userId: ID!, $messageId: ID!, $wasHelpful: Boolean!) {
    quickFeedback(userId: $userId, messageId: $messageId, wasHelpful: $wasHelpful) { id wasHelpful }
  }
`;

const FEEDBACK_CATEGORIES = [
  { value: 'EXPLANATION_CLARITY', label: 'Clear Explanation', emoji: '💡' },
  { value: 'RESPONSE_RELEVANCE', label: 'Relevant Answer', emoji: '🎯' },
  { value: 'DIFFICULTY_LEVEL', label: 'Right Difficulty', emoji: '📊' },
  { value: 'ENGAGEMENT', label: 'Engaging', emoji: '✨' },
  { value: 'TECHNICAL_ERROR', label: 'Had Issues', emoji: '⚠️' },
  { value: 'OTHER', label: 'Other', emoji: '💬' },
];

// Quick Feedback Buttons (Thumbs up/down)
export function QuickFeedbackButtons({ userId, messageId, onFeedbackGiven }) {
  const [submitted, setSubmitted] = useState(null);
  const [submitQuickFeedback, { loading }] = useMutation(QUICK_FEEDBACK, {
    onCompleted: (data) => { setSubmitted(data.quickFeedback.wasHelpful); onFeedbackGiven?.(data.quickFeedback); }
  });

  if (submitted !== null) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-600">
        <CheckCircle className="w-3.5 h-3.5" /> Thanks!
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400">Helpful?</span>
      <button onClick={() => submitQuickFeedback({ variables: { userId, messageId, wasHelpful: true } })}
        disabled={loading} className="p-1.5 rounded-md hover:bg-green-50 text-gray-400 hover:text-green-600 transition-all disabled:opacity-50">
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => submitQuickFeedback({ variables: { userId, messageId, wasHelpful: false } })}
        disabled={loading} className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all disabled:opacity-50">
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Detailed Feedback Modal
export function FeedbackModal({ userId, messageId, isOpen, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [category, setCategory] = useState(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [submitFeedback, { loading }] = useMutation(SUBMIT_FEEDBACK, {
    onCompleted: () => {
      setSubmitted(true);
      setTimeout(() => { onClose(); setRating(0); setCategory(null); setComment(''); setSubmitted(false); }, 1500);
    }
  });

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Thank You! 🎉</h3>
              <p className="text-gray-500 text-sm">Your feedback helps us improve</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900">Share Feedback</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
              </div>

              {/* Stars */}
              <div className="mb-5">
                <label className="block text-sm text-gray-500 mb-2">Rate this response</label>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)} className="p-0.5">
                      <Star className={`w-7 h-7 transition-all ${star <= (hoveredRating || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="mb-5">
                <label className="block text-sm text-gray-500 mb-2">Category (optional)</label>
                <div className="flex flex-wrap gap-1.5">
                  {FEEDBACK_CATEGORIES.map(cat => (
                    <button key={cat.value} onClick={() => setCategory(category === cat.value ? null : cat.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                        category === cat.value ? 'bg-blue-50 border border-blue-300 text-blue-700' : 'bg-gray-50 border border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-5">
                <label className="block text-sm text-gray-500 mb-1"><MessageSquare className="w-3.5 h-3.5 inline mr-1" /> Comments (optional)</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Tell us more..." rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>

              <button onClick={() => { if (rating > 0) submitFeedback({ variables: { userId, messageId, rating, category, comment: comment.trim() || null, wasHelpful: rating >= 3 } }); }}
                disabled={rating === 0 || loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-40 flex items-center justify-center gap-1.5">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Feedback'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// Feedback Button that opens modal
export function FeedbackButton({ userId, messageId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsModalOpen(true)}
        className="text-xs text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1">
        <MessageSquare className="w-3 h-3" /> Feedback
      </button>
      <FeedbackModal userId={userId} messageId={messageId} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
