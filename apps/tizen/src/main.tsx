import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global reset for Tizen TV browser
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; height: 100%; overflow: hidden; background: #1A0008; }
  body { -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { display: none; }
  button { font-family: inherit; }
  input { font-family: inherit; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
