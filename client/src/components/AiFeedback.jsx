import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ThumbsUp, ThumbsDown, MessageSquare, Star, X,
  CheckCircle, Loader2
} from 'lucide-react';

const SUBMIT_FEEDBACK = gql`
  mutation SubmitFeedback(
    $userId: ID!
    $messageId: ID!
    $rating: Int!
    $category: FeedbackCategory
    $comment: String
    $wasHelpful: Boolean!
  ) {
    submitFeedback(
      userId: $userId
      messageId: $messageId
      rating: $rating
      category: $category
      comment: $comment
      wasHelpful: $wasHelpful
    ) {
      id
      rating
      wasHelpful
    }
  }
`;

const QUICK_FEEDBACK = gql`
  mutation QuickFeedback($userId: ID!, $messageId: ID!, $wasHelpful: Boolean!) {
    quickFeedback(userId: $userId, messageId: $messageId, wasHelpful: $wasHelpful) {
      id
      wasHelpful
    }
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
    onCompleted: (data) => {
      setSubmitted(data.quickFeedback.wasHelpful);
      onFeedbackGiven?.(data.quickFeedback);
    }
  });

  const handleFeedback = (wasHelpful) => {
    submitQuickFeedback({
      variables: { userId, messageId, wasHelpful }
    });
  };

  if (submitted !== null) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 text-sm text-emerald-400"
      >
        <CheckCircle className="w-4 h-4" />
        Thanks for your feedback!
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">Was this helpful?</span>
      <button
        onClick={() => handleFeedback(true)}
        disabled={loading}
        className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all disabled:opacity-50"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleFeedback(false)}
        disabled={loading}
        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-50"
      >
        <ThumbsDown className="w-4 h-4" />
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
      setTimeout(() => {
        onClose();
        // Reset state
        setRating(0);
        setCategory(null);
        setComment('');
        setSubmitted(false);
      }, 1500);
    }
  });

  const handleSubmit = () => {
    if (rating === 0) return;
    
    submitFeedback({
      variables: {
        userId,
        messageId,
        rating,
        category,
        comment: comment.trim() || null,
        wasHelpful: rating >= 3,
      }
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900 border border-white/[0.1] rounded-2xl p-6 max-w-md w-full shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Thank You! 🎉</h3>
              <p className="text-slate-400">Your feedback helps us improve</p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Share Your Feedback</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/[0.05] transition-all"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Star Rating */}
              <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-3">How would you rate this response?</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 transition-all ${
                          star <= (hoveredRating || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center text-sm text-slate-500 mt-2">
                  {rating === 0 ? 'Tap to rate' : 
                   rating <= 2 ? 'We\'ll do better!' :
                   rating === 3 ? 'It was okay' :
                   rating === 4 ? 'Pretty good!' : 'Excellent! 🌟'}
                </div>
              </div>

              {/* Category Selection */}
              <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-3">What was best about it? (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(category === cat.value ? null : cat.value)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        category === cat.value
                          ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-300'
                          : 'bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:bg-white/[0.05]'
                      }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Additional comments (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 
                           text-white placeholder-slate-500 outline-none resize-none
                           focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium
                         hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                ) : (
                  <>Submit Feedback</>
                )}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Feedback Button that opens modal
export function FeedbackButton({ userId, messageId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-xs text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
      >
        <MessageSquare className="w-3 h-3" /> Give feedback
      </button>
      <FeedbackModal
        userId={userId}
        messageId={messageId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
