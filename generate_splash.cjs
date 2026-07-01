const fs = require('fs');
const html = fs.readFileSync('preloader.html', 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
const style = styleMatch ? styleMatch[1] : '';

const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/i);
const body = bodyMatch ? bodyMatch[1] : '';

fs.mkdirSync('src/pages', { recursive: true });
fs.writeFileSync('src/pages/Splash.css', style);

const tsx = `import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Splash.css';

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // The CSS animation wrapFadeOut takes 0.6s and starts at 6.2s (total 6.8s).
    const timer = setTimeout(() => {
      navigate('/onboarding');
    }, 6900);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div dangerouslySetInnerHTML={{ __html: \`${body.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\` }} />
  );
};

export default Splash;
`;
fs.writeFileSync('src/pages/Splash.tsx', tsx);
console.log('Successfully created Splash.tsx and Splash.css');
