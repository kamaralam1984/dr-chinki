
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Dr. Chinki Neural Interface: Booting up...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("CRITICAL: Root element not found.");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <App />
  );
  console.log("Dr. Chinki Neural Interface: System Ready.");
} catch (error) {
  console.error("Dr. Chinki Crash Report:", error);
}
