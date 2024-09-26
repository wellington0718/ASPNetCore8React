import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import MainLayout from './components/mainLayout.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <MainLayout>
            <App />
        </MainLayout>
    </StrictMode>,
)
