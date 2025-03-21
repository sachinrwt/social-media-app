import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
    defaultOptions:{
      queries: {
        //Used so that of you say opened home page in one tab and notification page in another tab , then
        //when you switch the tabs , bydefault it fetches the page again=> to avoid that we use "refetchOnWindowFocus"
        refetchOnWindowFocus:false,
      }
    }
}) ;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
    
  </StrictMode>,
)
