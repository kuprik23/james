/**
 * James Ultimate - Notification & Alert Manager
 * Handles toast notifications, alerts, and system-wide notifications
 * 
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import { EventEmitter } from 'events';
import { Alert, ToastNotification, AlertAction } from '../types';

export class NotificationManager extends EventEmitter {
  private alerts: Map<string, Alert>;
  private toasts: Map<string, ToastNotification>;
  private nextId: number;

  constructor() {
    super();
    this.alerts = new Map();
    this.toasts = new Map();
    this.nextId = 1;
  }

  /**
   * Show a toast notification (temporary message)
   */
  showToast(
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    duration: number = 5000,
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right'
  ): string {
    const id = `toast-${this.nextId++}`;
    const toast: ToastNotification = {
      id,
      type,
      message,
      duration,
      position
    };

    this.toasts.set(id, toast);
    this.emit('toast', toast);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }

    return id;
  }

  /**
   * Remove a toast notification
   */
  removeToast(id: string): void {
    if (this.toasts.has(id)) {
      this.toasts.delete(id);
      this.emit('toastRemoved', id);
    }
  }

  /**
   * Show an alert (persistent until dismissed)
   */
  showAlert(
    type: 'error' | 'warning' | 'info' | 'success',
    title: string,
    message: string,
    options: {
      dismissible?: boolean;
      actions?: AlertAction[];
      autoClose?: number;
    } = {}
  ): string {
    const id = `alert-${this.nextId++}`;
    const alert: Alert = {
      id,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      dismissible: options.dismissible !== false,
      actions: options.actions,
      autoClose: options.autoClose
    };

    this.alerts.set(id, alert);
    this.emit('alert', alert);

    // Auto-close if specified
    if (options.autoClose && options.autoClose > 0) {
      setTimeout(() => {
        this.removeAlert(id);
      }, options.autoClose);
    }

    return id;
  }

  /**
   * Remove an alert
   */
  removeAlert(id: string): void {
    if (this.alerts.has(id)) {
      this.alerts.delete(id);
      this.emit('alertRemoved', id);
    }
  }

  /**
   * Show success notification
   */
  success(message: string, duration?: number): string {
    return this.showToast('success', message, duration);
  }

  /**
   * Show error notification
   */
  error(message: string, duration?: number): string {
    return this.showToast('error', message, duration);
  }

  /**
   * Show warning notification
   */
  warning(message: string, duration?: number): string {
    return this.showToast('warning', message, duration);
  }

  /**
   * Show info notification
   */
  info(message: string, duration?: number): string {
    return this.showToast('info', message, duration);
  }

  /**
   * Show critical alert (requires user action)
   */
  critical(title: string, message: string, actions?: AlertAction[]): string {
    return this.showAlert('error', title, message, {
      dismissible: false,
      actions
    });
  }

  /**
   * Confirm dialog
   */
  confirm(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): string {
    return this.showAlert('warning', title, message, {
      dismissible: true,
      actions: [
        {
          label: 'Confirm',
          action: () => {
            onConfirm();
          },
          style: 'primary'
        },
        {
          label: 'Cancel',
          action: () => {
            if (onCancel) onCancel();
          },
          style: 'secondary'
        }
      ]
    });
  }

  /**
   * Get all active alerts
   */
  getAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get all active toasts
   */
  getToasts(): ToastNotification[] {
    return Array.from(this.toasts.values());
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.alerts.clear();
    this.toasts.clear();
    this.emit('cleared');
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts.clear();
    this.emit('alertsCleared');
  }

  /**
   * Clear all toasts
   */
  clearToasts(): void {
    this.toasts.clear();
    this.emit('toastsCleared');
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();