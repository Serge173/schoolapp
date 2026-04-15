import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

/** Favicon d’onglet volontairement vide (évite logo / ancienne icône en cache). */
const BLANK_FAVICON =
  'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"/>');
(() => {
  document
    .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
    .forEach((el) => el.remove());
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = BLANK_FAVICON;
  document.head.appendChild(link);
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
