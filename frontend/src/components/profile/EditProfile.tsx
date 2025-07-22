import React, { useState, useEffect } from 'react';
import { User } from '../../services/auth.service'; // Using the imported User type
import { useToast } from '../../contexts/ToastContext'; // From 'main'

// A list of countries for the dropdown, from 'main'
const countries = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain',
  'Japan', 'China', 'India', 'Australia', 'Brazil', 'Mexico', 'Netherlands', 'Sweden',
  'Norway', 'Denmark', 'Switzerland', 'Austria', 'Belgium', 'Portugal', 'Greece',
  'Turkey', 'South Korea', 'Thailand', 'Singapore', 'Malaysia', 'Indonesia', 'Philippines',
  'Vietnam', 'New Zealand', 'South Africa', 'Egypt', 'Morocco', 'Argentina', 'Chile',
  'Colombia', 'Peru', 'Russia', 'Poland', 'Czech Republic', 'Hungary', 'Finland', 'Ireland'
];

interface EditProfileProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  // Using onSave from 'feats' as it's more descriptive of the action
  onSave: (updatedData: Partial<User>) => Promise<void>;
}

export const EditProfile: React.FC<EditProfileProps> = ({ user, isOpen, onClose, onSave }) => {
  // Merged state from both branches
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    username: user.username || '',
    bio: user.bio || '',
    location: user.location || '',
    homeAirport: user.homeAirport || '',
    passportCountry: user.passportCountry || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({}); // From 'feats' for validation
  const { showToast } = useToast(); // From 'main' for notifications

  // useEffect from 'main' to keep form data fresh if user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        username: user.username || '',
        bio: user.bio || '',
        location: user.location || '',
        homeAirport: user.homeAirport || '',
        passportCountry: user.passportCountry || '',
      });
    }
  }, [user]);

  // Input change handler from 'feats' which also clears errors
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validation function from 'feats'
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) newErrors.username = 'Username can only contain letters, numbers, and underscores';
    if (formData.bio.length > 150) newErrors.bio = 'Bio must be 150 characters or less';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Merged handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return; // Validation check from 'feats'

    setIsLoading(true);
    try {
      await onSave(formData);
      showToast('Profile updated successfully!', 'success'); // Toast from 'main'
      onClose();
    } catch (error: any) {
      // Specific error handling from 'feats', combined with toasts from 'main'
      if (error.response?.data?.message === 'Username is already taken') {
        setErrors({ username: 'Username is already taken' });
        showToast('Username is already taken.', 'error');
      } else {
        showToast('Failed to update profile. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Merged JSX, combining structure, fields, and styling from both branches
  return (
    <div style={{ /* Modal backdrop styles from 'main' */
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
    }}>
      <div style={{ /* Modal content styles from 'main' */
        backgroundColor: 'white', borderRadius: '12px', padding: '2rem',
        width: '100%', maxWidth: '500px', maxHeight: '90vh',
        overflowY: 'auto', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: 'var(--pb-dark-purple)' }}>
            Edit Profile
          </h2>
          <button onClick={onClose} style={{ /* Close button styles from 'main' */
            background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer',
            color: 'var(--pb-medium-purple)', padding: '0.25rem'
          }}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Full Name field with validation styling from 'feats' */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', fontSize: '1rem', border: `1px solid ${errors.fullName ? '#dc2626' : 'var(--pb-light-periwinkle)'}` }}
            />
            {errors.fullName && <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>{errors.fullName}</span>}
          </div>

          {/* Username field with validation from 'feats' */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', fontSize: '1rem', border: `1px solid ${errors.username ? '#dc2626' : 'var(--pb-light-periwinkle)'}` }}
            />
            {errors.username && <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>{errors.username}</span>}
          </div>
          
          {/* Bio field with validation from 'feats' */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
              maxLength={150}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', fontSize: '1rem', resize: 'vertical', border: `1px solid ${errors.bio ? '#dc2626' : 'var(--pb-light-periwinkle)'}` }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
              {errors.bio && <span style={{ color: '#dc2626' }}>{errors.bio}</span>}
              <span style={{ marginLeft: 'auto' }}>{formData.bio.length}/150</span>
            </div>
          </div>
          
          {/* Location field */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Location</label>
            <input
              type="text"
              placeholder="e.g., San Francisco, CA"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', fontSize: '1rem', border: '1px solid var(--pb-light-periwinkle)' }}
            />
          </div>

          {/* Home Airport field */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Home Airport</label>
            <input
              type="text"
              placeholder="e.g., SFO, JFK, LHR"
              maxLength={4}
              value={formData.homeAirport}
              onChange={(e) => handleInputChange('homeAirport', e.target.value.toUpperCase())}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', fontSize: '1rem', border: '1px solid var(--pb-light-periwinkle)' }}
            />
          </div>

          {/* Passport Country dropdown from 'main' */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Passport Country</label>
            <select
              value={formData.passportCountry}
              onChange={(e) => handleInputChange('passportCountry', e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', fontSize: '1rem', border: '1px solid var(--pb-light-periwinkle)', backgroundColor: 'white' }}
            >
              <option value="">Select your passport country</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          
          {/* Action buttons with styling/layout from 'main' */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} disabled={isLoading} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', backgroundColor: 'white', color: 'var(--pb-medium-purple)', border: '1px solid var(--pb-light-periwinkle)', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', backgroundColor: 'var(--pb-medium-purple)', color: 'white', border: 'none', cursor: 'pointer', opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
