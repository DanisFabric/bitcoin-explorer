import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/iosevka/400.css'
import '@fontsource/iosevka/500.css'
import '@fontsource/iosevka/700.css'
import '@fontsource/iosevka/800.css'
import { App } from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
