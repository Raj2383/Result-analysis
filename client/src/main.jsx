import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App.jsx';
import Providers from './app/providers.jsx';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
);
