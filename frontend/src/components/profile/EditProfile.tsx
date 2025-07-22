import React, { useState, useEffect } from 'react';
import { userService } from '../../services/user.service';
import { useToast } from '../../contexts/ToastContext';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  bio?: string;
  location?: string;
  homeAirport?: string;
  passportCountry?: string;
  avatar?: string;
}

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    bio: user.bio || '',
    location: user.location || '',
    homeAirport: user.homeAirport || '',
    passportCountry: user.passportCountry || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        bio: user.bio || '',
        location: user.location || '',
        homeAirport: user.homeAirport || '',
        passportCountry: user.passportCountry || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await userService.updateProfile(formData);
      
      if (response.status === 'success') {
        onUpdate(response.data.user);
        showToast('Profile updated successfully!', 'success');
        onClose();
      } else {
        showToast(response.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain',
    'Japan', 'China', 'India', 'Australia', 'Brazil', 'Mexico', 'Netherlands', 'Sweden',
    'Norway', 'Denmark', 'Switzerland', 'Austria', 'Belgium', 'Portugal', 'Greece',
    'Turkey', 'South Korea', 'Thailand', 'Singapore', 'Malaysia', 'Indonesia', 'Philippines',
    'Vietnam', 'New Zealand', 'South Africa', 'Egypt', 'Morocco', 'Argentina', 'Chile',
    'Colombia', 'Peru', 'Russia', 'Poland', 'Czech Republic', 'Hungary', 'Finland', 'Ireland'
  ];

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
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
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
              color: 'var(--pb-medium-purple)',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Full Name */}
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
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--pb-light-periwinkle)',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--pb-medium-purple)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--pb-light-periwinkle)';
                }}
              />
            </div>

            {/* Bio */}
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
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                maxLength={150}
                placeholder="Tell others about your travel adventures..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--pb-light-periwinkle)',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--pb-medium-purple)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--pb-light-periwinkle)';
                }}
              />
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--pb-medium-purple)',
                textAlign: 'right',
                marginTop: '0.25rem'
              }}>
                {formData.bio.length}/150
              </div>
            </div>

            {/* Location */}
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
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Where are you based?"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--pb-light-periwinkle)',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--pb-medium-purple)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--pb-light-periwinkle)';
                }}
              />
            </div>

            {/* Home Airport */}
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
                name="homeAirport"
                value={formData.homeAirport}
                onChange={handleChange}
                placeholder="e.g., LAX, JFK, LHR"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--pb-light-periwinkle)',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--pb-medium-purple)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--pb-light-periwinkle)';
                }}
              />
            </div>

            {/* Passport Country */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: 'var(--pb-dark-purple)'
              }}>
                Passport Country
              </label>
              <select
                name="passportCountry"
                value={formData.passportCountry}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--pb-light-periwinkle)',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--pb-medium-purple)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--pb-light-periwinkle)';
                }}
              >
                <option value="">Select your passport country</option>
                {countries.map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            marginTop: '2rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid var(--pb-light-periwinkle)',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: 'var(--pb-medium-purple)',
                fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'var(--pb-ultra-light)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: isLoading ? '#ccc' : 'var(--pb-medium-purple)',
                color: 'white',
                fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'var(--pb-dark-purple)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'var(--pb-medium-purple)';
                }
              }}
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};