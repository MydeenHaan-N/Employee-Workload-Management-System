import Swal from 'sweetalert2';

/**
 * Centralized SweetAlert2 service for critical/destructive actions
 * Use ONLY for confirmations that require user attention
 */

const defaultConfig = {
  customClass: {
    popup: 'rounded-lg shadow-xl',
    title: 'text-xl font-semibold text-gray-900',
    htmlContainer: 'text-sm text-gray-600',
    confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200 mr-2',
    cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 px-6 rounded-lg transition-colors duration-200',
  },
  buttonsStyling: false,
  reverseButtons: true,
  focusCancel: true,
};

export const alertService = {
  /**
   * Confirm deletion of a resource
   */
  confirmDelete: async (resourceName = 'item') => {
    return Swal.fire({
      ...defaultConfig,
      title: `Delete ${resourceName}?`,
      html: `This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });
  },

  /**
   * Confirm logout action
   */
  confirmLogout: async () => {
    return Swal.fire({
      ...defaultConfig,
      title: 'Sign out?',
      html: 'You will need to log in again to access your account.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sign out',
      cancelButtonText: 'Stay logged in',
      customClass: {
        ...defaultConfig.customClass,
        confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200 mr-2',
      },
    });
  },

  /**
   * Confirm task removal/cancellation
   */
  confirmTaskRemoval: async (taskTitle = 'this task') => {
    return Swal.fire({
      ...defaultConfig,
      title: 'Remove task?',
      html: `Are you sure you want to remove "${taskTitle}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Keep task',
    });
  },

  /**
   * Confirm user removal/deactivation
   */
  confirmUserRemoval: async (userName = 'this user') => {
    return Swal.fire({
      ...defaultConfig,
      title: 'Remove employee?',
      html: `Are you sure you want to remove ${userName}?<br/><span class="text-xs text-gray-500 mt-2 block">All associated tasks will be unassigned.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    });
  },

  /**
   * Generic confirmation dialog
   */
  confirm: async ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDangerous = false }) => {
    return Swal.fire({
      ...defaultConfig,
      title,
      html: message,
      icon: isDangerous ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      customClass: {
        ...defaultConfig.customClass,
        confirmButton: isDangerous
          ? defaultConfig.customClass.confirmButton
          : 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200 mr-2',
      },
    });
  },
};