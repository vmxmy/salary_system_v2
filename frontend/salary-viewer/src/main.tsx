import React from 'react'
import ReactDOM from 'react-dom/client'
import { App as AntApp } from 'antd';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App.tsx'
import './index.css'
import 'antd/dist/reset.css';
import './i18n';
import '@ant-design/v5-patch-for-react-19';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AntApp>
        <App />
      </AntApp>
    </Provider>
  </React.StrictMode>,
)
