import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();
const flag = fs.readFileSync(path.join(__dirname, 'public/flag.png')).toString('base64');
const aaharmitraLogo = fs.readFileSync(path.join(__dirname, 'public/aaharmitra_logo.png')).toString('base64');

const content = `window.APP_ASSETS = {
  FLAG: "data:image/png;base64,${flag}",
  AAHARMITRA_LOGO: "data:image/png;base64,${aaharmitraLogo}"
};
`;

fs.writeFileSync(path.join(__dirname, 'src/assets_script.js'), content);
console.log('src/assets_script.js successfully created!');
