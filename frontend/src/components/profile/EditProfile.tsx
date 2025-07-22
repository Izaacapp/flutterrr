import React, { useState } from 'react';
import { User } from '../../services/auth.service';

interface EditProfileProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: Partial<User>) => Promise<void>;
}

export const EditProfile: React.FC<EditProfileProps> = ({ user, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    username: user.username || '',
    bio: user.bio || '',
    location: user.location || '',
    homeAirport: user.homeAirport || '',
    passportCountry: user.passportCountry || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (formData.bio.length > 150) {
      newErrors.bio = 'Bio must be 150 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error: any) {
      if (error.response?.data?.message === 'Username is already taken') {
        setErrors({ username: 'Username is already taken' });
      } else {
        setErrors({ general: 'Failed to update profile. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        margin: '1rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            fontWeight: '600',
            color: 'var(--pb-dark-purple)' 
          }}>
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {errors.general && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '0.75rem',
            marginBottom: '1rem',
            color: '#dc2626'
          }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: 'var(--pb-dark-purple)'
            }}>
              Full Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${errors.fullName ? '#dc2626' : 'var(--pb-light-periwinkle)'}`,
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--pb-medium-purple)'}
              onBlur={(e) => e.target.style.borderColor = errors.fullName ? '#dc2626' : 'var(--pb-light-periwinkle)'}
            />
            {errors.fullName && (
              <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>{errors.fullName}</span>
            )}
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: 'var(--pb-dark-purple)'
            }}>
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${errors.username ? '#dc2626' : 'var(--pb-light-periwinkle)'}`,
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--pb-medium-purple)'}
              onBlur={(e) => e.target.style.borderColor = errors.username ? '#dc2626' : 'var(--pb-light-periwinkle)'}
            />
            {errors.username && (
              <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>{errors.username}</span>
            )}
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: 'var(--pb-dark-purple)'
            }}>
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
              maxLength={150}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${errors.bio ? '#dc2626' : 'var(--pb-light-periwinkle)'}`,
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--pb-medium-purple)'}
              onBlur={(e) => e.target.style.borderColor = errors.bio ? '#dc2626' : 'var(--pb-light-periwinkle)'}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '0.875rem', 
              color: '#666',
              marginTop: '0.25rem'
            }}>
              {errors.bio && <span style={{ color: '#dc2626' }}>{errors.bio}</span>}
              <span style={{ marginLeft: 'auto' }}>{formData.bio.length}/150</span>
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: 'var(--pb-dark-purple)'
            }}>
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., San Francisco, CA"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--pb-light-periwinkle)',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--pb-medium-purple)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--pb-light-periwinkle)'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: 'var(--pb-dark-purple)'
            }}>
              Home Airport
            </label>
            <input
              type="text"
              value={formData.homeAirport}
              onChange={(e) => handleInputChange('homeAirport', e.target.value.toUpperCase())}
              placeholder="e.g., SFO, JFK, LHR"
              maxLength={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--pb-light-periwinkle)',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--pb-medium-purple)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--pb-light-periwinkle)'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: 'var(--pb-dark-purple)'
            }}>
              Passport Country
            </label>
            <input
              type="text"
              value={formData.passportCountry}
              onChange={(e) => handleInputChange('passportCountry', e.target.value)}
              placeholder="e.g., United States, Canada, United Kingdom"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--pb-light-periwinkle)',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--pb-medium-purple)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--pb-light-periwinkle)'}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                border: '1px solid var(--pb-light-periwinkle)',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: 'var(--pb-dark-purple)',
                fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: 'var(--pb-medium-purple)',
                color: 'white',
                fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};