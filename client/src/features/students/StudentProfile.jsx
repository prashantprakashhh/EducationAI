import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Calendar, GraduationCap, School, BookOpen, Heart,
  Sparkles, Save, Edit3, Trophy, Flame, Star, Target,
  ChevronRight, Check, X, Loader2, Camera, Zap
} from 'lucide-react';

// GraphQL Queries & Mutations
const GET_STUDENT_PROFILE = gql`
  query GetStudentProfile($userId: ID!) {
    studentProfile(userId: $userId) {
      id
      displayName
      dateOfBirth
      age
      gradeLevel
      school
      course
      interests
      preferredLearningStyle
      learningGoals
      totalXp
      currentStreak
      avatarUrl
      profileCompleted
      level
      xpToNextLevel
    }
  }
`;

const CREATE_PROFILE = gql`
  mutation CreateStudentProfile(
    $userId: ID!
    $displayName: String!
    $dateOfBirth: String!
    $gradeLevel: GradeLevel!
    $school: String
    $course: String
    $interests: [String]
  ) {
    createStudentProfile(
      userId: $userId
      displayName: $displayName
      dateOfBirth: $dateOfBirth
      gradeLevel: $gradeLevel
      school: $school
      course: $course
      interests: $interests
    ) {
      id
      displayName
      age
      gradeLevel
    }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateStudentProfile(
    $userId: ID!
    $displayName: String
    $dateOfBirth: String
    $gradeLevel: GradeLevel
    $school: String
    $course: String
    $interests: [String]
    $learningStyle: LearningStyle
    $learningGoals: String
    $avatarUrl: String
  ) {
    updateStudentProfile(
      userId: $userId
      displayName: $displayName
      dateOfBirth: $dateOfBirth
      gradeLevel: $gradeLevel
      school: $school
      course: $course
      interests: $interests
      learningStyle: $learningStyle
      learningGoals: $learningGoals
      avatarUrl: $avatarUrl
    ) {
      id
      displayName
      age
      gradeLevel
      profileCompleted
    }
  }
`;

// Grade levels data
const GRADE_LEVELS = [
  { value: 'GRADE_1', label: '1st Grade', emoji: '🌱' },
  { value: 'GRADE_2', label: '2nd Grade', emoji: '🌿' },
  { value: 'GRADE_3', label: '3rd Grade', emoji: '🌳' },
  { value: 'GRADE_4', label: '4th Grade', emoji: '📚' },
  { value: 'GRADE_5', label: '5th Grade', emoji: '✨' },
  { value: 'GRADE_6', label: '6th Grade', emoji: '🚀' },
  { value: 'GRADE_7', label: '7th Grade', emoji: '💫' },
  { value: 'GRADE_8', label: '8th Grade', emoji: '🎯' },
  { value: 'GRADE_9', label: '9th Grade', emoji: '🔥' },
  { value: 'GRADE_10', label: '10th Grade', emoji: '⭐' },
  { value: 'GRADE_11', label: '11th Grade', emoji: '🎓' },
  { value: 'GRADE_12', label: '12th Grade', emoji: '👑' },
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

// XP Progress Bar Component
const XPProgressBar = ({ totalXp, xpToNextLevel, level }) => {
  const progress = ((100 - xpToNextLevel) / 100) * 100;
  
  return (
    <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.08]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">Level {level || 1}</div>
            <div className="text-sm text-slate-400">{totalXp || 0} XP Total</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Next Level</div>
          <div className="text-lg font-semibold text-amber-400">{xpToNextLevel || 100} XP</div>
        </div>
      </div>
      
      <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
        />
      </div>
    </div>
  );
};

// Streak Display Component
const StreakDisplay = ({ streak }) => (
  <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.08]">
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
        <Flame className="w-6 h-6 text-orange-400" />
      </div>
      <div>
        <div className="text-3xl font-bold text-white">{streak || 0}</div>
        <div className="text-sm text-slate-400">Day Streak 🔥</div>
      </div>
    </div>
  </div>
);

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
        // Build update variables, only including fields with actual values
        const updateVars = { userId };
        
        if (formData.displayName && formData.displayName.trim()) {
          updateVars.displayName = formData.displayName.trim();
        }
        if (formData.dateOfBirth) {
          updateVars.dateOfBirth = formData.dateOfBirth;
        }
        if (formData.gradeLevel) {
          updateVars.gradeLevel = formData.gradeLevel;
        }
        if (formData.school && formData.school.trim()) {
          updateVars.school = formData.school.trim();
        }
        if (formData.course && formData.course.trim()) {
          updateVars.course = formData.course.trim();
        }
        if (formData.interests && formData.interests.length > 0) {
          updateVars.interests = formData.interests;
        }
        if (formData.learningStyle) {
          updateVars.learningStyle = formData.learningStyle;
        }
        if (formData.learningGoals && formData.learningGoals.trim()) {
          updateVars.learningGoals = formData.learningGoals.trim();
        }
        
        console.log('Updating profile with:', updateVars);
        await updateProfile({ variables: updateVars });
      } else {
        // Create requires all fields
        const createVars = {
          userId,
          displayName: formData.displayName?.trim() || 'Student',
          dateOfBirth: formData.dateOfBirth,
          gradeLevel: formData.gradeLevel,
          school: formData.school?.trim() || null,
          course: formData.course?.trim() || null,
          interests: formData.interests || [],
        };
        
        console.log('Creating profile with:', createVars);
        await createProfile({ variables: createVars });
      }
      onComplete?.();
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const totalSteps = 4;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                s <= step
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                  : 'bg-white/[0.05] text-slate-500'
              }`}
            >
              {s < step ? <Check className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>
        <div className="h-2 bg-white/[0.05] rounded-full">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                <User className="w-10 h-10 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Let's get to know you! 👋</h2>
              <p className="text-slate-400">Tell us your name and when you were born</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  What should we call you?
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Your nickname or name"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-4 
                           text-white placeholder-slate-500 outline-none
                           focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-4 
                           text-white outline-none
                           focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Grade Level */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
                <GraduationCap className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">What grade are you in? 📚</h2>
              <p className="text-slate-400">This helps us personalize your learning experience</p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {GRADE_LEVELS.map((grade) => (
                <button
                  key={grade.value}
                  onClick={() => setFormData(prev => ({ ...prev, gradeLevel: grade.value }))}
                  className={`p-4 rounded-xl border transition-all ${
                    formData.gradeLevel === grade.value
                      ? 'bg-emerald-500/20 border-emerald-500/50 scale-105'
                      : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="text-2xl mb-1">{grade.emoji}</div>
                  <div className={`text-sm font-medium ${
                    formData.gradeLevel === grade.value ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {grade.label}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <School className="w-4 h-4 inline mr-2" />
                  School Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.school}
                  onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                  placeholder="Your school name"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 
                           text-white placeholder-slate-500 outline-none
                           focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Stream/Course (Optional)
                </label>
                <input
                  type="text"
                  value={formData.course}
                  onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                  placeholder="e.g., Science, Commerce"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 
                           text-white placeholder-slate-500 outline-none
                           focus:border-indigo-500/50"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Interests */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center border border-pink-500/30">
                <Heart className="w-10 h-10 text-pink-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">What do you love learning? ❤️</h2>
              <p className="text-slate-400">Select subjects that interest you (pick at least 2)</p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {SUBJECT_INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-4 py-2 rounded-full border transition-all ${
                    formData.interests.includes(interest)
                      ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                      : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:bg-white/[0.05]'
                  }`}
                >
                  {formData.interests.includes(interest) && <Check className="w-4 h-4 inline mr-1" />}
                  {interest}
                </button>
              ))}
            </div>

            <div className="text-center text-sm text-slate-500 mt-4">
              {formData.interests.length} subjects selected
            </div>
          </motion.div>
        )}

        {/* Step 4: Learning Style */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                <Target className="w-10 h-10 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">How do you learn best? 🎯</h2>
              <p className="text-slate-400">This helps our AI tutor adapt to your style</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {LEARNING_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setFormData(prev => ({ ...prev, learningStyle: style.value }))}
                  className={`p-6 rounded-xl border transition-all text-left ${
                    formData.learningStyle === style.value
                      ? 'bg-cyan-500/20 border-cyan-500/50'
                      : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="text-3xl mb-2">{style.icon}</div>
                  <div className={`font-semibold mb-1 ${
                    formData.learningStyle === style.value ? 'text-cyan-300' : 'text-white'
                  }`}>
                    {style.label}
                  </div>
                  <div className="text-sm text-slate-400">{style.desc}</div>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                What are your learning goals? (Optional)
              </label>
              <textarea
                value={formData.learningGoals}
                onChange={(e) => setFormData(prev => ({ ...prev, learningGoals: e.target.value }))}
                placeholder="e.g., Improve math skills, prepare for exams..."
                rows={3}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 
                         text-white placeholder-slate-500 outline-none resize-none
                         focus:border-indigo-500/50"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep(prev => Math.max(1, prev - 1))}
          disabled={step === 1}
          className="px-6 py-3 rounded-xl bg-white/[0.05] text-slate-300 font-medium 
                   hover:bg-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Back
        </button>

        {step < totalSteps ? (
          <button
            onClick={() => setStep(prev => Math.min(totalSteps, prev + 1))}
            disabled={
              (step === 1 && (!formData.displayName || !formData.dateOfBirth)) ||
              (step === 2 && !formData.gradeLevel)
            }
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium
                     hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            Next <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={creating || updating}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium
                     hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {(creating || updating) ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Complete Profile</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// Main Profile Component
export default function StudentProfile({ userId }) {
  const [isEditing, setIsEditing] = useState(false);
  
  const { data, loading, refetch } = useQuery(GET_STUDENT_PROFILE, {
    variables: { userId },
    skip: !userId,
  });

  const profile = data?.studentProfile;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  // Show setup form if no profile exists
  if (!profile || !profile.profileCompleted) {
    return (
      <div className="p-6">
        <ProfileSetupForm
          userId={userId}
          existingProfile={profile}
          onComplete={() => refetch()}
        />
      </div>
    );
  }

  // Show edit form
  if (isEditing) {
    return (
      <div className="p-6">
        <ProfileSetupForm
          userId={userId}
          existingProfile={profile}
          onComplete={() => {
            refetch();
            setIsEditing(false);
          }}
        />
      </div>
    );
  }

  // Profile Display
  return (
    <div className="p-6 space-y-6">
      {/* Header with Avatar */}
      <div className="relative">
        <div className="h-32 rounded-2xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30" />
        <div className="absolute -bottom-12 left-6 flex items-end gap-4">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 
                        flex items-center justify-center text-4xl font-bold text-white
                        border-4 border-slate-900 shadow-xl">
            {profile.displayName?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="pb-2">
            <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
            <div className="flex items-center gap-2 text-slate-400">
              <span>{profile.age} years old</span>
              <span>•</span>
              <span>{GRADE_LEVELS.find(g => g.value === profile.gradeLevel)?.label}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/[0.1] hover:bg-white/[0.2] transition-all"
        >
          <Edit3 className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mt-16">
        <XPProgressBar
          totalXp={profile.totalXp}
          xpToNextLevel={profile.xpToNextLevel}
          level={profile.level}
        />
        <StreakDisplay streak={profile.currentStreak} />
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* School Info */}
        <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.08]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-400" /> School Info
          </h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-slate-500">School</div>
              <div className="text-white">{profile.school || 'Not specified'}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Stream/Course</div>
              <div className="text-white">{profile.course || 'Not specified'}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Learning Style</div>
              <div className="text-white">
                {LEARNING_STYLES.find(s => s.value === profile.preferredLearningStyle)?.label || 'Not set'}
              </div>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.08]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" /> Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.interests?.length > 0 ? (
              profile.interests.map((interest, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-300 text-sm border border-pink-500/20"
                >
                  {interest}
                </span>
              ))
            ) : (
              <span className="text-slate-500">No interests added</span>
            )}
          </div>
        </div>
      </div>

      {/* Learning Goals */}
      {profile.learningGoals && (
        <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.08]">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" /> Learning Goals
          </h3>
          <p className="text-slate-300">{profile.learningGoals}</p>
        </div>
      )}
    </div>
  );
}
