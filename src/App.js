import { BrowserRouter as Router, Routes, Route, createRoutesFromElements, createBrowserRouter, RouterProvider } from 'react-router-dom'
import './App.css'
import './styles/colors.css'
import './styles/embedded.css'
import Dashboard from './components/Dashboard'
import ProgressView from './components/ProgressView'
import AlexaConnect from './components/AlexaConnect'
import AlexaAuthCallback from './components/AlexaAuthCallback'
import Login from './components/Login'
import AuthProvider from './components/AuthProvider'
import PrivateRoute from './components/PrivateRoute'
import PrivacyPolicy from './components/PrivacyPolicy'
import { useEffect, useState } from 'react'
import OAuthCallback from './components/OAuthCallback'
import { auth } from './services/firebase'
import { checkServiceAvailability } from './utils/serviceCheck'
import ServiceBlockedMessage from './components/ServiceBlockedMessage'

// Create router with future flags enabled
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/progress" element={
        <PrivateRoute>
          <ProgressView />
        </PrivateRoute>
      } />
    
      <Route path="/alexa-connect" element={
        <PrivateRoute>
          <AlexaConnect />
        </PrivateRoute>
      } />
      <Route path="/alexa-auth-callback" element={
        <PrivateRoute>
          <AlexaAuthCallback />
        </PrivateRoute>
      } />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

// Create embedded router with proper authentication
const embeddedRouter = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/login" element={<Login isEmbedded={true} />} />
      <Route path="*" element={
        <PrivateRoute>
          <Dashboard isEmbedded={true} />
        </PrivateRoute>
      } />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

function App({ isEmbedded = false }) {
  const [blockedServices, setBlockedServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBlockedMessage, setShowBlockedMessage] = useState(false);

  useEffect(() => {
    const checkServices = async () => {
      // Skip service checks in embedded mode
      if (isEmbedded) {
        setIsLoading(false);
        return;
      }

      // Check if we've already shown the message this session
      const hasShownMessage = sessionStorage.getItem('blockedMessageShown');
      
      if (!hasShownMessage) {
        const blocked = [];
        
        // Check Firebase availability
        const isFirebaseAvailable = await checkServiceAvailability('firebase');
        if (!isFirebaseAvailable) {
          blocked.push('firebase');
        }

        setBlockedServices(blocked);
        if (blocked.length > 0) {
          setShowBlockedMessage(true);
          sessionStorage.setItem('blockedMessageShown', 'true');
        }
      }
      
      setIsLoading(false);
    };

    checkServices();
  }, [isEmbedded]);

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  // In embedded mode
  if (isEmbedded) {
    return (
      <AuthProvider>
        <div className={`app app-embedded`}>
          <main className="main-container">
            <div className="content">
              <RouterProvider router={embeddedRouter} />
            </div>
          </main>
        </div>
      </AuthProvider>
    );
  }

  // Full app for standalone mode
  return (
    <AuthProvider>
      <div className="app">
        {showBlockedMessage && blockedServices.map(service => (
          <ServiceBlockedMessage key={service} service={service} />
        ))}
        <main className="main-container">
          <div className="content">
            <RouterProvider router={router} />
          </div>
        </main>
      </div>
    </AuthProvider>
  )
}

export default App
