export const COMPLAINT_CATEGORIES = [
  { id: 'adulteration', label: 'Adulteration', icon: '🧪', color: '#0F4C3A' },
  { id: 'expired_product', label: 'Expired Product', icon: '📅', color: '#0F4C3A' },
  { id: 'unhygienic_premises', label: 'Unhygienic Premises', icon: '🧹', color: '#0F4C3A' },
  { id: 'mislabeling', label: 'Mislabeling', icon: '🏷️', color: '#0F4C3A' },
  { id: 'pest_contamination', label: 'Pest Contamination', icon: '🪳', color: '#0F4C3A' },
  { id: 'other', label: 'Other', icon: '➕', color: '#0F4C3A' },
];

export const MAHARASHTRA_DISTRICTS = [
  'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara',
  'Buldhana', 'Chandrapur', 'Chhatrapati Sambhajinagar', 'Dharashiv', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon',
  'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded',
  'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad',
  'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha',
  'Washim', 'Yavatmal'
];

export const MAHARASHTRA_TALUKAS: Record<string, string[]> = {
  Ahmednagar: ['Ahmednagar', 'Shrirampur', 'Nevasa', 'Rahuri', 'Shrigonda', 'Karjat', 'Jamkhed', 'Pathardi', 'Parner', 'Sangamner', 'Kopargaon', 'Akole', 'Rahata', 'Newasa'],
  Akola: ['Akola', 'Akot', 'Telhara', 'Balapur', 'Patur', 'Murtizapur', 'Barshitakli'],
  Amravati: ['Amravati', 'Achalpur', 'Morshi', 'Warud', 'Daryapur', 'Anjangaon Surji', 'Chandur Railway', 'Chandur Bazar', 'Nandgaon-Khandeshwar', 'Dhamangaon Railway', 'Chikhaldara', 'Bhatkuli', 'Dharni', 'Tiosa'],
  Aurangabad: ['Aurangabad', 'Khuldabad', 'Kannad', 'Sillod', 'Phulambri', 'Soegaon', 'Paithan', 'Gangapur', 'Vaijapur'],
  'Chhatrapati Sambhajinagar': ['Aurangabad', 'Khuldabad', 'Kannad', 'Sillod', 'Phulambri', 'Soegaon', 'Paithan', 'Gangapur', 'Vaijapur'],
  Beed: ['Beed', 'Kaij', 'Georai', 'Majalgaon', 'Parli', 'Ambajogai', 'Dharur', 'Patoda', 'Shirur Kasar', 'Ashti', 'Wadwani'],
  Bhandara: ['Bhandara', 'Tumsar', 'Pauni', 'Mohadi', 'Sakoli', 'Lakhani', 'Lakhandur'],
  Buldhana: ['Buldhana', 'Chikhli', 'Deulgaon Raja', 'Jalgaon Jamod', 'Khamgaon', 'Lonar', 'Malkapur', 'Mehkar', 'Motala', 'Nandura', 'Sangrampur', 'Shegaon', 'Sindkhed Raja'],
  Chandrapur: ['Chandrapur', 'Ballarpur', 'Bhadravati', 'Warora', 'Chimur', 'Nagbhid', 'Brahmapuri', 'Sindewahi', 'Mul', 'Gondpipri', 'Pombhurna', 'Saoli', 'Rajura', 'Korpana', 'Jiwati'],
  Dhule: ['Dhule', 'Sakri', 'Shirpur', 'Sindkheda'],
  Gadchiroli: ['Gadchiroli', 'Chamorshi', 'Aheri', 'Etapalli', 'Dhanora', 'Armori', 'Kurkheda', 'Korchi', 'Desaiganj', 'Sironcha', 'Mulchera', 'Bhamragad'],
  Gondia: ['Gondia', 'Tirora', 'Goregaon', 'Arjuni Morgaon', 'Amgaon', 'Deori', 'Salekasa', 'Sadak Arjuni'],
  Hingoli: ['Hingoli', 'Sengaon', 'Kalamnuri', 'Basmath', 'Aundha Nagnath'],
  Jalgaon: ['Jalgaon', 'Bhusawal', 'Chalisgaon', 'Amalner', 'Erandol', 'Dharangaon', 'Pachora', 'Bhadgaon', 'Parola', 'Chopda', 'Raver', 'Yawal', 'Muktainagar', 'Bodwad', 'Jamner'],
  Jalna: ['Jalna', 'Bhokardan', 'Jafrabad', 'Ambad', 'Badnapur', 'Ghansawangi', 'Partur', 'Mantha'],
  Kolhapur: ['Kolhapur', 'Karveer', 'Panhala', 'Shahuwadi', 'Kagal', 'Hatkanangle', 'Shirol', 'Radhanagari', 'Gadhinglaj', 'Chandgad', 'Ajra', 'Bhudargad', 'Bavda'],
  Latur: ['Latur', 'Ausa', 'Nilanga', 'Udgir', 'Chakur', 'Deoni', 'Jalkot', 'Ahmedpur', 'Shirur Anantpal', 'Renapur'],
  'Mumbai City': ['Mumbai City', 'Colaba', 'Nariman Point', 'Fort', 'Byculla', 'Dadar'],
  'Mumbai Suburban': ['Andheri', 'Bandra', 'Borivali', 'Kurla', 'Ghatkopar', 'Malad', 'Kandivali', 'Powai'],
  Nagpur: ['Nagpur City', 'Nagpur Rural', 'Kamptee', 'Hingna', 'Katol', 'Narkhed', 'Savner', 'Kalmeshwar', 'Parseoni', 'Umred', 'Kuhi', 'Bhiwapur', 'Ramtek', 'Mouda'],
  Nanded: ['Nanded', 'Ardhapur', 'Mudkhed', 'Bhokar', 'Umri', 'Loha', 'Kandhar', 'Kinwat', 'Hadgaon', 'Himayatnagar', 'Deglur', 'Mukhed', 'Dharmabad', 'Biloli', 'Naigaon', 'Mahoor'],
  Nandurbar: ['Nandurbar', 'Shahada', 'Taloda', 'Akkalkuwa', 'Akrani', 'Nawapur'],
  Nashik: ['Nashik', 'Malegaon', 'Niphad', 'Sinnar', 'Igatpuri', 'Dindori', 'Peint', 'Trimbakeshwar', 'Kalwan', 'Deola', 'Surgana', 'Baglan', 'Chandwad', 'Nandgaon', 'Yeola'],
  Osmanabad: ['Osmanabad', 'Tuljapur', 'Umarga', 'Paranda', 'Bhoom', 'Kalamb', 'Washi', 'Lohara'],
  Dharashiv: ['Osmanabad', 'Tuljapur', 'Umarga', 'Paranda', 'Bhoom', 'Kalamb', 'Washi', 'Lohara'],
  Palghar: ['Palghar', 'Vasai', 'Dahanu', 'Talasari', 'Jawhar', 'Mokhada', 'Vikramgad', 'Wada'],
  Parbhani: ['Parbhani', 'Jintur', 'Gangakhed', 'Pathri', 'Purna', 'Manwath', 'Palam', 'Sonpeth', 'Selu'],
  Pune: ['Haveli', 'Pune City', 'Maval', 'Mulshi', 'Shirur', 'Baramati', 'Khed', 'Junnar', 'Ambegaon', 'Bhor', 'Velhe', 'Purandar', 'Indapur', 'Daund'],
  Raigad: ['Panvel', 'Alibag', 'Pen', 'Karjat', 'Khopoli', 'Uran', 'Mahad', 'Mangaon', 'Roha', 'Sudhagad', 'Murud', 'Shrivardhan', 'Mhasla', 'Tala', 'Poladpur'],
  Ratnagiri: ['Ratnagiri', 'Chiplun', 'Guhagar', 'Dapoli', 'Khed', 'Mandangad', 'Sangameshwar', 'Lanja', 'Rajapur'],
  Sangli: ['Sangli', 'Miraj', 'Tasgaon', 'Walwa', 'Shirala', 'Palus', 'Kadegaon', 'Khanapur', 'Atpadi', 'Jat'],
  Satara: ['Satara', 'Karad', 'Wai', 'Mahabaleshwar', 'Patan', 'Jawali', 'Khandala', 'Koregaon', 'Phaltan', 'Man', 'Khatav'],
  Sindhudurg: ['Sindhudurg', 'Kudal', 'Malwan', 'Devgad', 'Kankavli', 'Sawantwadi', 'Vengurla', 'Dodamarg'],
  Solapur: ['Solapur North', 'Solapur South', 'Akkalkot', 'Barshi', 'Mohol', 'Mangalwedha', 'Madha', 'Karmala', 'Pandharpur', 'Malshiras', 'Sangola'],
  Thane: ['Thane', 'Kalyan', 'Bhiwandi', 'Ulhasnagar', 'Ambernath', 'Shahapur', 'Murbad'],
  Wardha: ['Wardha', 'Deoli', 'Hinganghat', 'Arvi', 'Seloo', 'Ashti', 'Karanja', 'Samudrapur'],
  Washim: ['Washim', 'Malegaon', 'Risod', 'Mangrulpir', 'Karanja', 'Manora'],
  Yavatmal: ['Yavatmal', 'Arni', 'Babhulgaon', 'Darwha', 'Digras', 'Ghatanji', 'Kalamb', 'Kelapur', 'Mahagaon', 'Maregaon', 'Ner', 'Pusad', 'Ralegaon', 'Umarkhed', 'Wani', 'Zari-Jamani']
};

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
