import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  User, Calendar, GraduationCap, School, BookOpen, Heart,
  Sparkles, Edit3, Trophy, Flame, Target,
  ChevronRight, Check, Loader2
} from 'lucide-react';

// GraphQL
const GET_STUDENT_PROFILE = gql`
  query GetStudentProfile($userId: ID!) {
    studentProfile(userId: $userId) {
      id displayName dateOfBirth age gradeLevel school course interests
      preferredLearningStyle learningGoals totalXp currentStreak avatarUrl
      profileCompleted level xpToNextLevel
    }
  }
`;
const CREATE_PROFILE = gql`
  mutation CreateStudentProfile($userId: ID!, $displayName: String!, $dateOfBirth: String!, $gradeLevel: GradeLevel!, $school: String, $course: String, $interests: [String]) {
    createStudentProfile(userId: $userId, displayName: $displayName, dateOfBirth: $dateOfBirth, gradeLevel: $gradeLevel, school: $school, course: $course, interests: $interests) {
      id displayName age gradeLevel
    }
  }
`;
const UPDATE_PROFILE = gql`
  mutation UpdateStudentProfile($userId: ID!, $displayName: String, $dateOfBirth: String, $gradeLevel: GradeLevel, $school: String, $course: String, $interests: [String], $learningStyle: LearningStyle, $learningGoals: String, $avatarUrl: String) {
    updateStudentProfile(userId: $userId, displayName: $displayName, dateOfBirth: $dateOfBirth, gradeLevel: $gradeLevel, school: $school, course: $course, interests: $interests, learningStyle: $learningStyle, learningGoals: $learningGoals, avatarUrl: $avatarUrl) {
      id displayName age gradeLevel profileCompleted
    }
  }
`;

const GRADE_LEVELS = [
  { value: 'GRADE_1', label: '1st', emoji: '🌱' }, { value: 'GRADE_2', label: '2nd', emoji: '🌿' },
  { value: 'GRADE_3', label: '3rd', emoji: '🌳' }, { value: 'GRADE_4', label: '4th', emoji: '📚' },
  { value: 'GRADE_5', label: '5th', emoji: '✨' }, { value: 'GRADE_6', label: '6th', emoji: '🚀' },
  { value: 'GRADE_7', label: '7th', emoji: '💫' }, { value: 'GRADE_8', label: '8th', emoji: '🎯' },
  { value: 'GRADE_9', label: '9th', emoji: '🔥' }, { value: 'GRADE_10', label: '10th', emoji: '⭐' },
  { value: 'GRADE_11', label: '11th', emoji: '🎓' }, { value: 'GRADE_12', label: '12th', emoji: '👑' },
];

const LEARNING_STYLES = [
  { value: 'VISUAL', label: 'Visual', icon: '👁️', desc: 'Learn by seeing' },
  { value: 'AUDITORY', label: 'Auditory', icon: '👂', desc: 'Learn by listening' },
  { value: 'READING_WRITING', label: 'Reading/Writing', icon: '📝', desc: 'Learn by reading' },
  { value: 'KINESTHETIC', label: 'Kinesthetic', icon: '🤲', desc: 'Learn by doing' },
];

const SUBJECT_INTERESTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'English', 'History', 'Geography', 'Art', 'Music', 'Sports',
  'Economics', 'Psychology', 'Literature', 'Foreign Languages'
];

// Profile Setup Form
const ProfileSetupForm = ({ userId, onComplete, existingProfile }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: existingProfile?.displayName || '',
    dateOfBirth: existingProfile?.dateOfBirth || '',
    gradeLevel: existingProfile?.gradeLevel || '',
    school: existingProfile?.school || '',
    course: existingProfile?.course || '',
    interests: existingProfile?.interests || [],
    learningStyle: existingProfile?.preferredLearningStyle || '',
    learningGoals: existingProfile?.learningGoals || '',
  });

  const [createProfile, { loading: creating }] = useMutation(CREATE_PROFILE);
  const [updateProfile, { loading: updating }] = useMutation(UPDATE_PROFILE);

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async () => {
    try {
      if (existingProfile) {
        const vars = { userId };
        if (formData.displayName?.trim()) vars.displayName = formData.displayName.trim();
        if (formData.dateOfBirth) vars.dateOfBirth = formData.dateOfBirth;
        if (formData.gradeLevel) vars.gradeLevel = formData.gradeLevel;
        if (formData.school?.trim()) vars.school = formData.school.trim();
        if (formData.course?.trim()) vars.course = formData.course.trim();
        if (formData.interests?.length > 0) vars.interests = formData.interests;
        if (formData.learningStyle) vars.learningStyle = formData.learningStyle;
        if (formData.learningGoals?.trim()) vars.learningGoals = formData.learningGoals.trim();
        await updateProfile({ variables: vars });
      } else {
        await createProfile({
          variables: {
            userId,
            displayName: formData.displayName?.trim() || 'Student',
            dateOfBirth: formData.dateOfBirth,
            gradeLevel: formData.gradeLevel,
            school: formData.school?.trim() || null,
            course: formData.course?.trim() || null,
            interests: formData.interests || [],
          }
        });
      }
      onComplete?.();
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const totalSteps = 4;
  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-3">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold ${
              s <= step ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full">
          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-blue-50 flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Let's get to know you! 👋</h2>
            <p className="text-gray-500 text-sm">Tell us your name and birthday</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What should we call you?</label>
            <input type="text" value={formData.displayName} placeholder="Your nickname"
              onChange={e => setFormData(p => ({ ...p, displayName: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1"><Calendar className="w-4 h-4 inline mr-1" /> Date of Birth</label>
            <input type="date" value={formData.dateOfBirth}
              onChange={e => setFormData(p => ({ ...p, dateOfBirth: e.target.value }))} className={inputClass} />
          </div>
        </div>
      )}

      {/* Step 2: Grade */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-green-50 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">What grade are you in? 📚</h2>
            <p className="text-gray-500 text-sm">This personalizes your learning</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {GRADE_LEVELS.map(g => (
              <button key={g.value} onClick={() => setFormData(p => ({ ...p, gradeLevel: g.value }))}
                className={`p-3 rounded-lg border text-center transition-all ${
                  formData.gradeLevel === g.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                <div className="text-xl">{g.emoji}</div>
                <div className="text-xs font-medium mt-0.5">{g.label}</div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><School className="w-4 h-4 inline mr-1" /> School (Optional)</label>
              <input type="text" value={formData.school} placeholder="School name"
                onChange={e => setFormData(p => ({ ...p, school: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><BookOpen className="w-4 h-4 inline mr-1" /> Stream (Optional)</label>
              <input type="text" value={formData.course} placeholder="e.g. Science"
                onChange={e => setFormData(p => ({ ...p, course: e.target.value }))} className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Interests */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-pink-50 flex items-center justify-center">
              <Heart className="w-8 h-8 text-pink-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">What do you love? ❤️</h2>
            <p className="text-gray-500 text-sm">Pick subjects that interest you</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {SUBJECT_INTERESTS.map(interest => (
              <button key={interest} onClick={() => handleInterestToggle(interest)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                  formData.interests.includes(interest)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                {formData.interests.includes(interest) && <Check className="w-3 h-3 inline mr-1" />}
                {interest}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400">{formData.interests.length} selected</p>
        </div>
      )}

      {/* Step 4: Learning Style */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Target className="w-8 h-8 text-cyan-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">How do you learn best? 🎯</h2>
            <p className="text-gray-500 text-sm">Helps our AI tutor adapt to you</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {LEARNING_STYLES.map(s => (
              <button key={s.value} onClick={() => setFormData(p => ({ ...p, learningStyle: s.value }))}
                className={`p-4 rounded-lg border text-left transition-all ${
                  formData.learningStyle === s.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className={`text-sm font-medium ${formData.learningStyle === s.value ? 'text-blue-700' : 'text-gray-900'}`}>{s.label}</div>
                <div className="text-xs text-gray-500">{s.desc}</div>
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Learning goals (Optional)</label>
            <textarea value={formData.learningGoals} placeholder="e.g., Improve math skills..."
              onChange={e => setFormData(p => ({ ...p, learningGoals: e.target.value }))} rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button onClick={() => setStep(p => Math.max(1, p - 1))} disabled={step === 1}
          className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40">
          Back
        </button>
        {step < totalSteps ? (
          <button onClick={() => setStep(p => Math.min(totalSteps, p + 1))}
            disabled={(step === 1 && (!formData.displayName || !formData.dateOfBirth)) || (step === 2 && !formData.gradeLevel)}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-40 flex items-center gap-1">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={creating || updating}
            className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-40 flex items-center gap-1.5">
            {(creating || updating) ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Sparkles className="w-4 h-4" /> Complete</>}
          </button>
        )}
      </div>
    </div>
  );
};

// Main Profile Component
export default function StudentProfile({ userId }) {
  const [isEditing, setIsEditing] = useState(false);
  const { data, loading, refetch } = useQuery(GET_STUDENT_PROFILE, { variables: { userId }, skip: !userId });
  const profile = data?.studentProfile;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  if (!profile || !profile.profileCompleted) {
    return <div className="p-6"><ProfileSetupForm userId={userId} existingProfile={profile} onComplete={() => refetch()} /></div>;
  }

  if (isEditing) {
    return <div className="p-6"><ProfileSetupForm userId={userId} existingProfile={profile} onComplete={() => { refetch(); setIsEditing(false); }} /></div>;
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="relative">
        <div className="h-28 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600" />
        <div className="absolute -bottom-10 left-5 flex items-end gap-4">
          <div className="w-20 h-20 rounded-xl bg-blue-700 flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-lg">
            {profile.displayName?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="pb-1">
            <h1 className="text-xl font-bold text-gray-900">{profile.displayName}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{profile.age} years old</span>·
              <span>{GRADE_LEVELS.find(g => g.value === profile.gradeLevel)?.label} Grade</span>
            </div>
          </div>
        </div>
        <button onClick={() => setIsEditing(true)}
          className="absolute top-3 right-3 p-2 rounded-lg bg-white/80 hover:bg-white text-gray-600 transition-all">
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-14">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-5 h-5 text-amber-500" />
            <div>
              <div className="text-xl font-bold text-gray-900">Level {profile.level || 1}</div>
              <div className="text-sm text-gray-500">{profile.totalXp || 0} XP</div>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${((100 - (profile.xpToNextLevel || 100)) / 100) * 100}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{profile.xpToNextLevel || 100} XP to next level</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-3">
          <Flame className="w-5 h-5 text-orange-500" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{profile.currentStreak || 0}</div>
            <div className="text-sm text-gray-500">Day Streak 🔥</div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <School className="w-4 h-4 text-blue-600" /> School Info
          </h3>
          <div className="space-y-2.5 text-sm">
            <div><span className="text-gray-400">School:</span> <span className="text-gray-700">{profile.school || 'Not specified'}</span></div>
            <div><span className="text-gray-400">Stream:</span> <span className="text-gray-700">{profile.course || 'Not specified'}</span></div>
            <div><span className="text-gray-400">Style:</span> <span className="text-gray-700">{LEARNING_STYLES.find(s => s.value === profile.preferredLearningStyle)?.label || 'Not set'}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-pink-600" /> Interests
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {profile.interests?.length > 0
              ? profile.interests.map((interest, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{interest}</span>
                ))
              : <span className="text-gray-400 text-sm">No interests added</span>
            }
          </div>
        </div>
      </div>

      {profile.learningGoals && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-cyan-600" /> Learning Goals
          </h3>
          <p className="text-sm text-gray-600">{profile.learningGoals}</p>
        </div>
      )}
    </div>
  );
}
