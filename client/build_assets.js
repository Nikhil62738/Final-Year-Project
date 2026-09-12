import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();
const flag = fs.readFileSync(path.join(__dirname, 'public/flag.png')).toString('base64');
const emblem = fs.readFileSync(path.join(__dirname, 'public/emblem.png')).toString('base64');
const fda = fs.readFileSync(path.join(__dirname, 'public/fda_logo.png')).toString('base64');

const content = `export const FLAG_IMG = "data:image/png;base64,${flag}";
export const EMBLEM_IMG = "data:image/png;base64,${emblem}";
export const FDA_LOGO_IMG = "data:image/png;base64,${fda}";
`;

fs.writeFileSync(path.join(__dirname, 'src/assets.js'), content);
console.log('src/assets.js successfully created!');
