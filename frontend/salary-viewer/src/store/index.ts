import { configureStore } from '@reduxjs/toolkit';
import emailSenderReducer from './slices/emailSenderSlice';

export const store = configureStore({
  reducer: {
    emailSender: emailSenderReducer,
    // Add other reducers here as your application grows
  },
  // Middleware can be added here if needed, Redux Toolkit includes thunk by default
  // devTools: process.env.NODE_ENV !== 'production', // Enable DevTools only in development
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {emailSender: EmailSenderState, ...}
export type AppDispatch = typeof store.dispatch; 