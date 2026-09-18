export const COMPLAINT_CATEGORIES = [
  { id: 'adulteration', label: 'Adulteration', icon: '🧪', color: '#0F4C3A' },
  { id: 'expired_product', label: 'Expired Product', icon: '📅', color: '#0F4C3A' },
  { id: 'unhygienic_premises', label: 'Unhygienic Premises', icon: '🧹', color: '#0F4C3A' },
  { id: 'mislabeling', label: 'Mislabeling', icon: '🏷️', color: '#0F4C3A' },
  { id: 'pest_contamination', label: 'Pest Contamination', icon: '🪳', color: '#0F4C3A' },
  { id: 'other', label: 'Other', icon: '➕', color: '#0F4C3A' },
];

export const MAHARASHTRA_DISTRICTS = [
  'Ahmednagar', 'Akola', 'Amravati', 'Chhatrapati Sambhajinagar', 'Beed', 'Bhandara',
  'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon',
  'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded',
  'Nandurbar', 'Nashik', 'Dharashiv', 'Palghar', 'Parbhani', 'Pune', 'Raigad',
  'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha',
  'Washim', 'Yavatmal'
];

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  submitted: { label: 'Submitted', color: '#6366F1', icon: '📋' },
  under_review: { label: 'Under Review', color: '#0284C7', icon: '🔍' },
  action_taken: { label: 'Action Taken', color: '#EF4444', icon: '⚡' },
  resolved: { label: 'Resolved', color: '#10B981', icon: '✅' },
  closed: { label: 'Closed', color: '#94A3B8', icon: '🔒' },
};

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
];
