import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface DifyChatbotProps {
  // Optional props for customization
  customStyles?: {
    buttonColor?: string;
    windowWidth?: string;
    windowHeight?: string;
  };
}

/**
 * DifyChatbot component for integrating Dify chatbot with React
 * This component provides a way to dynamically update the chatbot configuration
 * based on the application state, such as user authentication.
 */
const DifyChatbot: React.FC<DifyChatbotProps> = ({ 
  customStyles = {
    buttonColor: '#1C64F2',
    windowWidth: '24rem',
    windowHeight: '40rem'
  } 
}) => {
  const { isAuthenticated, user } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    // Skip if already initialized
    if (initialized.current) return;
    
    // Update the chatbot configuration with user information if authenticated
    if (isAuthenticated && user) {
      window.difyChatbotConfig = {
        ...window.difyChatbotConfig,
        systemVariables: {
          user_id: user.id || user.username,
          // You can add more user-related variables here
        }
      };
    }

    // Apply custom styles if needed
    if (customStyles) {
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        #dify-chatbot-bubble-button {
          background-color: ${customStyles.buttonColor} !important;
        }
        #dify-chatbot-bubble-window {
          width: ${customStyles.windowWidth} !important;
          height: ${customStyles.windowHeight} !important;
        }
      `;
      document.head.appendChild(styleElement);
    }

    initialized.current = true;
  }, [isAuthenticated, user, customStyles]);

  // This component doesn't render anything visible
  return null;
};

// Add TypeScript declaration for the global window object
declare global {
  interface Window {
    difyChatbotConfig: {
      token: string;
      systemVariables: {
        user_id?: string;
        conversation_id?: string;
        [key: string]: any;
      };
    };
  }
}

export default DifyChatbot;
