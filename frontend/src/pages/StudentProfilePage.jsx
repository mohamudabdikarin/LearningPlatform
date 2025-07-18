import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { User, Mail, Phone, MapPin, Calendar, BookOpen, Award, Save, AlertCircle } from 'lucide-react';

const StudentProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { darkMode } = useDarkMode();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    birthDate: '',
    interests: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch user profile
        const profileData = await apiFetch('/users/profile');
        setProfile({
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          bio: profileData.bio || '',
          birthDate: profileData.birthDate || '',
          interests: profileData.interests || []
        });
        
        // Fetch achievements and certificates
        try {
          const achievementsData = await apiFetch('/users/achievements');
          setAchievements(achievementsData);
        } catch (err) {
          console.error('Failed to load achievements:', err);
        }
        
        try {
          const certificatesData = await apiFetch('/users/certificates');
          setCertificates(certificatesData);
        } catch (err) {
          console.error('Failed to load certificates:', err);
        }
      } catch (err) {
        setError(err.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleInterestChange = (e) => {
    const { value, checked } = e.target;
    setProfile(prev => ({
      ...prev,
      interests: checked 
        ? [...prev.interests, value]
        : prev.interests.filter(interest => interest !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const updatedProfile = await apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profile)
      });
      
      setProfile(updatedProfile);
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      
      // Update user context if needed
      if (updateUser) {
        updateUser({
          ...user,
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-full">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">My Profile</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Personal Information</h2>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg flex items-center">
                    <AlertCircle size={16} className="mr-2" />
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg flex items-center">
                    <Save size={16} className="mr-2" />
                    {success}
                  </div>
                )}
                
                {editMode ? (
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={profile.firstName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={profile.lastName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={profile.email}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={profile.phone}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Birth Date</label>
                        <input
                          type="date"
                          name="birthDate"
                          value={profile.birthDate}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                        <input
                          type="text"
                          name="address"
                          value={profile.address}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                      <textarea
                        name="bio"
                        value={profile.bio}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      ></textarea>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Learning Interests</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {['Programming', 'Design', 'Business', 'Marketing', 'Data Science', 'Languages'].map(interest => (
                          <div key={interest} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`interest-${interest}`}
                              value={interest}
                              checked={profile.interests.includes(interest)}
                              onChange={handleInterestChange}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`interest-${interest}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              {interest}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                      >
                        {saving ? (
                          <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </span>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center mb-2">
                          <User size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</span>
                        </div>
                        <p className="text-lg">{profile.firstName} {profile.lastName}</p>
                      </div>
                      <div>
                        <div className="flex items-center mb-2">
                          <Mail size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</span>
                        </div>
                        <p className="text-lg">{profile.email}</p>
                      </div>
                      {profile.phone && (
                        <div>
                          <div className="flex items-center mb-2">
                            <Phone size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</span>
                          </div>
                          <p className="text-lg">{profile.phone}</p>
                        </div>
                      )}
                      {profile.birthDate && (
                        <div>
                          <div className="flex items-center mb-2">
                            <Calendar size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Birth Date</span>
                          </div>
                          <p className="text-lg">{new Date(profile.birthDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {profile.address && (
                        <div>
                          <div className="flex items-center mb-2">
                            <MapPin size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</span>
                          </div>
                          <p className="text-lg">{profile.address}</p>
                        </div>
                      )}
                    </div>
                    
                    {profile.bio && (
                      <div>
                        <div className="flex items-center mb-2">
                          <User size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Bio</span>
                        </div>
                        <p className="text-base">{profile.bio}</p>
                      </div>
                    )}
                    
                    {profile.interests && profile.interests.length > 0 && (
                      <div>
                        <div className="flex items-center mb-2">
                          <BookOpen size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Learning Interests</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profile.interests.map(interest => (
                            <span 
                              key={interest}
                              className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Sidebar */}
            <div>
              {/* Achievements */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Achievements</h2>
                {achievements.length > 0 ? (
                  <div className="space-y-4">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mr-3">
                          <Award size={20} className="text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <h3 className="font-medium">{achievement.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{achievement.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Complete courses to earn achievements.</p>
                )}
              </div>
              
              {/* Certificates */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Certificates</h2>
                {certificates.length > 0 ? (
                  <div className="space-y-4">
                    {certificates.map((certificate) => (
                      <div key={certificate.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="font-medium">{certificate.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Issued on {new Date(certificate.issueDate).toLocaleDateString()}
                        </p>
                        <a 
                          href={certificate.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          View Certificate
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Complete courses to earn certificates.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;