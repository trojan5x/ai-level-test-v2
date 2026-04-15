import { useState, useEffect } from 'react';
import { supabase } from '../../supabase.js';
import bcrypt from 'bcryptjs';

const SESSION_KEY = 'ai-level-admin-session';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Check existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = () => {
    try {
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const { token, timestamp } = JSON.parse(sessionData);
        const now = Date.now();
        
        // Check if session is expired
        if (now - timestamp < SESSION_TIMEOUT) {
          setIsAuthenticated(true);
        } else {
          // Clear expired session
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      sessionStorage.removeItem(SESSION_KEY);
    }
    setIsLoading(false);
  };

  const login = async (password) => {
    setIsLoading(true);
    setLoginError('');

    try {
      console.log('Login attempt with password:', password);
      
      // For now, use simple password check
      const expectedPassword = 'LearnTube2026!';
      
      if (password === expectedPassword) {
        console.log('Password matches - creating session');
        
        // Create session first
        const sessionCreated = await createSession();
        
        if (sessionCreated) {
          console.log('Session created successfully, setting authenticated state');
          setIsAuthenticated(true);
          setIsLoading(false); // Set loading to false before returning
          return true;
        } else {
          setLoginError('Failed to create session');
          setIsLoading(false);
          return false;
        }
      } else {
        console.log('Password mismatch');
        setLoginError('Invalid password');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Login failed. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const createSession = async () => {
    try {
      // Generate session token
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + SESSION_TIMEOUT);

      console.log('Creating session with token:', sessionToken);

      // Store session in Supabase
      const { error } = await supabase
        .from('admin_sessions')
        .insert([{
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        }]);

      if (error) {
        console.warn('Failed to store session in database:', error);
      }

      // Store session locally
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        token: sessionToken,
        timestamp: Date.now()
      }));

      console.log('Session stored locally');
      return true; // Indicate success
    } catch (error) {
      console.error('Session creation error:', error);
      return false; // Indicate failure
    }
  };

  const logout = async () => {
    try {
      // Get current session
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const { token } = JSON.parse(sessionData);
        
        // Remove session from database
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('session_token', token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear local session
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      // Verify current password
      const { data: adminConfig, error } = await supabase
        .from('admin_config')
        .select('password_hash')
        .single();

      if (error) throw error;

      const isCurrentValid = await bcrypt.compare(currentPassword, adminConfig.password_hash);
      if (!isCurrentValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newHashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password in database
      const { error: updateError } = await supabase
        .from('admin_config')
        .update({ 
          password_hash: newHashedPassword,
          updated_at: new Date().toISOString()
        })
        .single();

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    isAuthenticated,
    isLoading,
    loginError,
    login,
    logout,
    changePassword
  };
};