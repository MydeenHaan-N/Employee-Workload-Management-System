import { toast } from 'react-hot-toast';

/**
 * Centralized Toast notification service for non-blocking feedback
 * Use for success messages, errors, validation feedback, and general notifications
 */

const defaultToastConfig = {
  duration: 4000,
  position: 'top-right',
  style: {
    borderRadius: '8px',
    fontSize: '14px',
    padding: '12px 16px',
    maxWidth: '400px',
  },
};

export const toastService = {
  /**
   * Success notification
   */
  success: (message) => {
    toast.success(message, {
      ...defaultToastConfig,
      icon: '✓',
      style: {
        ...defaultToastConfig.style,
        background: '#10B981',
        color: '#fff',
      },
    });
  },

  /**
   * Error notification
   */
  error: (message) => {
    toast.error(message, {
      ...defaultToastConfig,
      icon: '✕',
      duration: 5000,
      style: {
        ...defaultToastConfig.style,
        background: '#EF4444',
        color: '#fff',
      },
    });
  },

  /**
   * Warning notification
   */
  warning: (message) => {
    toast(message, {
      ...defaultToastConfig,
      icon: '⚠',
      style: {
        ...defaultToastConfig.style,
        background: '#F59E0B',
        color: '#fff',
      },
    });
  },

  /**
   * Info notification
   */
  info: (message) => {
    toast(message, {
      ...defaultToastConfig,
      icon: 'ℹ',
      style: {
        ...defaultToastConfig.style,
        background: '#3B82F6',
        color: '#fff',
      },
    });
  },

  /**
   * Loading notification with promise handling
   */
  promise: (promise, messages) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong',
      },
      {
        ...defaultToastConfig,
        style: {
          ...defaultToastConfig.style,
          minWidth: '250px',
        },
      }
    );
  },

  /**
   * Custom notification
   */
  custom: (message, options = {}) => {
    toast(message, {
      ...defaultToastConfig,
      ...options,
    });
  },

  /**
   * Dismiss all toasts
   */
  dismiss: () => {
    toast.dismiss();
  },
};

/**
 * Common toast messages for the application
 */
export const toastMessages = {
  // Authentication
  loginSuccess: 'Welcome back!',
  loginError: 'Invalid email or password',
  logoutSuccess: 'Signed out successfully',
  
  // Users
  userCreated: 'Employee added successfully',
  userUpdated: 'Employee updated successfully',
  userDeleted: 'Employee removed successfully',
  userError: 'Failed to process employee request',
  
  // Tasks
  taskCreated: 'Task created successfully',
  taskUpdated: 'Task updated successfully',
  taskDeleted: 'Task removed successfully',
  taskStatusUpdated: 'Task status updated',
  taskError: 'Failed to process task request',
  
  // General
  saveSuccess: 'Changes saved successfully',
  saveError: 'Failed to save changes',
  loadError: 'Failed to load data',
  networkError: 'Network error. Please check your connection.',
  permissionError: 'You do not have permission to perform this action',
};