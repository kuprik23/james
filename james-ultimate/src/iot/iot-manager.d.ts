/**
 * Type definitions for IoT Manager
 */

import { EventEmitter } from 'events';
import { IoTDevice, IoTProtocol } from '../types';

export class IoTManager extends EventEmitter {
  constructor();
  getProtocols(): Array<{ id: string; name: string; description: string; defaultPort?: number; securePort?: number }>;
  getDevices(): IoTDevice[];
  getDevice(id: string): IoTDevice | undefined;
  registerDevice(id: string, config: any): IoTDevice;
  connectDevice(deviceId: string): Promise<{ success: boolean; device: string }>;
  disconnectDevice(deviceId: string): Promise<{ success: boolean; device: string }>;
  removeDevice(deviceId: string): void;
  discoverDevices(options?: any): Promise<any[]>;
  registerAPI(id: string, config: any): IoTDevice;
  callAPI(deviceId: string, endpoint: string, method?: string, data?: any): Promise<any>;
}

export const iotManager: IoTManager;