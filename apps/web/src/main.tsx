import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { firebaseApp } from '@ecommerce/shared';

// Initialize Firebase SDK early
if (firebaseApp) {
  console.log('Firebase initialized for DailyFresh Storefront');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
