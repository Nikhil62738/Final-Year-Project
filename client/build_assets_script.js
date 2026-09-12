import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();
const flag = fs.readFileSync(path.join(__dirname, 'public/flag.png')).toString('base64');
const emblem = fs.readFileSync(path.join(__dirname, 'public/emblem.png')).toString('base64');
const fda = fs.readFileSync(path.join(__dirname, 'public/fda_logo.png')).toString('base64');

const content = `window.FDA_ASSETS = {
  FLAG: "data:image/png;base64,${flag}",
  EMBLEM: "data:image/png;base64,${emblem}",
  FDA_LOGO: "data:image/png;base64,${fda}"
};
`;

fs.writeFileSync(path.join(__dirname, 'src/assets_script.js'), content);
console.log('src/assets_script.js successfully created!');
