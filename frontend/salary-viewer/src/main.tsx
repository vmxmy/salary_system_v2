import React from 'react'
import ReactDOM from 'react-dom/client'
import { App as AntApp } from 'antd';
import App from './App.tsx'
import './index.css'
import 'antd/dist/reset.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AntApp>
      <App />
    </AntApp>
  </React.StrictMode>,
)
