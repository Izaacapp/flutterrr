import React from 'react';

export const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 6C2 5.44772 2.44772 5 3 5H5.58579C5.851 5 6.10536 4.89464 6.29289 4.70711L7.29289 3.70711C7.48043 3.51957 7.73478 3.41421 8 3.41421H12C12.2652 3.41421 12.5196 3.51957 12.7071 3.70711L13.7071 4.70711C13.8946 4.89464 14.149 5 14.4142 5H17C17.5523 5 18 5.44772 18 6V15C18 15.5523 17.5523 16 17 16H3C2.44772 16 2 15.5523 2 15V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 10L10 7M10 7L13 10M10 7V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.7 13.4C17.4734 12.8577 18 11.9883 18 11C18 9.34315 16.6569 8 15 8C14.8856 8 14.7726 8.00584 14.6611 8.01701C14.3439 5.71018 12.3661 4 10 4C7.41015 4 5.31133 6.09885 5.31133 8.68867C5.31133 8.89645 5.32718 9.10046 5.35775 9.29936C3.95497 9.8595 3 11.304 3 13C3 15.2091 4.79086 17 7 17H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 5V15M5 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.3333 2C11.5084 1.82491 11.747 1.72718 12 1.72718C12.1263 1.72718 12.2515 1.75207 12.3678 1.80029C12.484 1.84851 12.589 1.91912 12.6767 2.00682C12.7644 2.09452 12.835 2.19952 12.8832 2.31576C12.9314 2.432 12.9563 2.55726 12.9563 2.68359C12.9563 2.80992 12.9314 2.93518 12.8832 3.05142C12.835 3.16766 12.7644 3.27266 12.6767 3.36036L4.66667 11.3333L2 12L2.66667 9.33333L11.3333 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);