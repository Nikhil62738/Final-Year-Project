import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();
const flag = fs.readFileSync(path.join(__dirname, 'public/flag.png')).toString('base64');
const aaharmitraLogo = fs.readFileSync(path.join(__dirname, 'public/aaharmitra_logo.png')).toString('base64');

const content = `export const FLAG_IMG = "data:image/png;base64,${flag}";
export const AAHARMITRA_LOGO_IMG = "data:image/png;base64,${aaharmitraLogo}";
`;

fs.writeFileSync(path.join(__dirname, 'src/assets.js'), content);
console.log('src/assets.js successfully created!');
