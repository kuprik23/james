/**
 * James Ultimate - IoT Manager
 * Manages IoT device connections and protocols
 */

const EventEmitter = require('events');
const net = require('net');
const dgram = require('dgram');

class IoTManager extends EventEmitter {
  constructor() {
    super();
    this.devices = new Map();
    this.protocols = new Map();
    this.connections = new Map();
    
    // Initialize protocol handlers
    this.initializeProtocols();
  }

  initializeProtocols() {
    // MQTT Protocol
    this.registerProtocol('mqtt', {
      name: 'MQTT',
      description: 'Message Queuing Telemetry Transport',
      defaultPort: 1883,
      securePort: 8883,
      async connect(config) {
        try {
          const mqtt = require('mqtt');
          const client = mqtt.connect(config.url || `mqtt://${config.host}:${config.port || 1883}`, {
            username: config.username,
            password: config.password,
            clientId: config.clientId || `james_${Date.now()}`
          });
          
          return new Promise((resolve, reject) => {
            client.on('connect', () => resolve(client));
            client.on('error', reject);
            setTimeout(() => reject(new Error('Connection timeout')), 10000);
          });
        } catch (e) {
          throw new Error(`MQTT not available: ${e.message}`);
        }
      },
      async subscribe(client, topic, callback) {
        client.subscribe(topic);
        client.on('message', (t, message) => {
          if (t === topic || topic.includes('#') || topic.includes('+')) {
            callback(t, message.toString());
          }
        });
      },
      async publish(client, topic, message) {
        client.publish(topic, message);
      },
      async disconnect(client) {
        client.end();
      }
    });

    // CoAP Protocol
    this.registerProtocol('coap', {
      name: 'CoAP',
      description: 'Constrained Application Protocol',
      defaultPort: 5683,
      async connect(config) {
        try {
          const coap = require('coap');
          return { coap, host: config.host, port: config.port || 5683 };
        } catch (e) {
          throw new Error(`CoAP not available: ${e.message}`);
        }
      },
      async get(client, path) {
        return new Promise((resolve, reject) => {
          const req = client.coap.request({
            hostname: client.host,
            port: client.port,
            pathname: path,
            method: 'GET'
          });
          
          req.on('response', (res) => {
            resolve(res.payload.toString());
          });
          
          req.on('error', reject);
          req.end();
        });
      },
      async put(client, path, payload) {
        return new Promise((resolve, reject) => {
          const req = client.coap.request({
            hostname: client.host,
            port: client.port,
            pathname: path,
            method: 'PUT'
          });
          
          req.on('response', (res) => {
            resolve(res.payload.toString());
          });
          
          req.on('error', reject);
          req.write(payload);
          req.end();
        });
      }
    });

    // Modbus Protocol
    this.registerProtocol('modbus', {
      name: 'Modbus TCP',
      description: 'Industrial automation protocol',
      defaultPort: 502,
      async connect(config) {
        try {
          const ModbusRTU = require('modbus-serial');
          const client = new ModbusRTU();
          await client.connectTCP(config.host, { port: config.port || 502 });
          client.setID(config.unitId || 1);
          return client;
        } catch (e) {
          throw new Error(`Modbus not available: ${e.message}`);
        }
      },
      async readHoldingRegisters(client, address, length) {
        const data = await client.readHoldingRegisters(address, length);
        return data.data;
      },
      async readCoils(client, address, length) {
        const data = await client.readCoils(address, length);
        return data.data;
      },
      async writeRegister(client, address, value) {
        await client.writeRegister(address, value);
      },
      async disconnect(client) {
        client.close();
      }
    });

    // HTTP/REST API
    this.registerProtocol('http', {
      name: 'HTTP/REST',
      description: 'RESTful API protocol',
      defaultPort: 80,
      securePort: 443,
      async connect(config) {
        const axios = require('axios');
        return axios.create({
          baseURL: config.baseUrl || `http://${config.host}:${config.port || 80}`,
          headers: config.headers || {},
          auth: config.auth
        });
      },
      async get(client, path, params) {
        const response = await client.get(path, { params });
        return response.data;
      },
      async post(client, path, data) {
        const response = await client.post(path, data);
        return response.data;
      },
      async put(client, path, data) {
        const response = await client.put(path, data);
        return response.data;
      },
      async delete(client, path) {
        const response = await client.delete(path);
        return response.data;
      }
    });

    // WebSocket Protocol
    this.registerProtocol('websocket', {
      name: 'WebSocket',
      description: 'Full-duplex communication protocol',
      defaultPort: 80,
      securePort: 443,
      async connect(config) {
        const WebSocket = require('ws');
        const ws = new WebSocket(config.url || `ws://${config.host}:${config.port || 80}`);
        
        return new Promise((resolve, reject) => {
          ws.on('open', () => resolve(ws));
          ws.on('error', reject);
          setTimeout(() => reject(new Error('Connection timeout')), 10000);
        });
      },
      async send(client, message) {
        client.send(typeof message === 'string' ? message : JSON.stringify(message));
      },
      async onMessage(client, callback) {
        client.on('message', (data) => callback(data.toString()));
      },
      async disconnect(client) {
        client.close();
      }
    });

    // Serial Port (for local IoT devices)
    this.registerProtocol('serial', {
      name: 'Serial Port',
      description: 'Serial communication for local devices',
      async connect(config) {
        try {
          const { SerialPort } = require('serialport');
          const port = new SerialPort({
            path: config.path,
            baudRate: config.baudRate || 9600
          });
          
          return new Promise((resolve, reject) => {
            port.on('open', () => resolve(port));
            port.on('error', reject);
          });
        } catch (e) {
          throw new Error(`SerialPort not available: ${e.message}`);
        }
      },
      async write(client, data) {
        return new Promise((resolve, reject) => {
          client.write(data, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      },
      async onData(client, callback) {
        client.on('data', callback);
      },
      async disconnect(client) {
        client.close();
      }
    });

    // Raw TCP
    this.registerProtocol('tcp', {
      name: 'Raw TCP',
      description: 'Raw TCP socket connection',
      async connect(config) {
        const socket = new net.Socket();
        
        return new Promise((resolve, reject) => {
          socket.connect(config.port, config.host, () => resolve(socket));
          socket.on('error', reject);
          setTimeout(() => reject(new Error('Connection timeout')), 10000);
        });
      },
      async send(client, data) {
        client.write(data);
      },
      async onData(client, callback) {
        client.on('data', callback);
      },
      async disconnect(client) {
        client.destroy();
      }
    });

    // Raw UDP
    this.registerProtocol('udp', {
      name: 'Raw UDP',
      description: 'Raw UDP socket connection',
      async connect(config) {
        const socket = dgram.createSocket('udp4');
        socket.targetHost = config.host;
        socket.targetPort = config.port;
        return socket;
      },
      async send(client, message) {
        return new Promise((resolve, reject) => {
          client.send(message, client.targetPort, client.targetHost, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      },
      async onMessage(client, callback) {
        client.on('message', (msg, rinfo) => callback(msg, rinfo));
      },
      async disconnect(client) {
        client.close();
      }
    });
  }

  registerProtocol(id, config) {
    this.protocols.set(id, {
      id,
      ...config
    });
  }

  getProtocols() {
    return Array.from(this.protocols.values()).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      defaultPort: p.defaultPort,
      securePort: p.securePort
    }));
  }

  // Device Management
  registerDevice(id, config) {
    const device = {
      id,
      name: config.name || id,
      type: config.type || 'generic',
      protocol: config.protocol,
      host: config.host,
      port: config.port,
      credentials: config.credentials,
      metadata: config.metadata || {},
      status: 'disconnected',
      lastSeen: null,
      connection: null
    };
    
    this.devices.set(id, device);
    this.emit('deviceRegistered', { device: id });
    
    return device;
  }

  getDevices() {
    return Array.from(this.devices.values()).map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      protocol: d.protocol,
      host: d.host,
      port: d.port,
      status: d.status,
      lastSeen: d.lastSeen
    }));
  }

  getDevice(id) {
    return this.devices.get(id);
  }

  async connectDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device '${deviceId}' not found`);
    }
    
    const protocol = this.protocols.get(device.protocol);
    if (!protocol) {
      throw new Error(`Protocol '${device.protocol}' not supported`);
    }
    
    try {
      const connection = await protocol.connect({
        host: device.host,
        port: device.port,
        ...device.credentials
      });
      
      device.connection = connection;
      device.status = 'connected';
      device.lastSeen = new Date().toISOString();
      
      this.connections.set(deviceId, connection);
      this.emit('deviceConnected', { device: deviceId });
      
      return { success: true, device: deviceId };
    } catch (error) {
      device.status = 'error';
      this.emit('deviceError', { device: deviceId, error: error.message });
      throw error;
    }
  }

  async disconnectDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device '${deviceId}' not found`);
    }
    
    const protocol = this.protocols.get(device.protocol);
    const connection = this.connections.get(deviceId);
    
    if (connection && protocol.disconnect) {
      await protocol.disconnect(connection);
    }
    
    device.connection = null;
    device.status = 'disconnected';
    this.connections.delete(deviceId);
    
    this.emit('deviceDisconnected', { device: deviceId });
    
    return { success: true, device: deviceId };
  }

  async sendToDevice(deviceId, action, data) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device '${deviceId}' not found`);
    }
    
    if (device.status !== 'connected') {
      throw new Error(`Device '${deviceId}' is not connected`);
    }
    
    const protocol = this.protocols.get(device.protocol);
    const connection = this.connections.get(deviceId);
    
    if (!protocol[action]) {
      throw new Error(`Action '${action}' not supported for protocol '${device.protocol}'`);
    }
    
    const result = await protocol[action](connection, ...data);
    device.lastSeen = new Date().toISOString();
    
    return result;
  }

  removeDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device '${deviceId}' not found`);
    }
    
    // Disconnect if connected
    if (device.status === 'connected') {
      this.disconnectDevice(deviceId).catch(() => {});
    }
    
    this.devices.delete(deviceId);
    this.emit('deviceRemoved', { device: deviceId });
  }

  // Discovery
  async discoverDevices(options = {}) {
    const discovered = [];
    
    // Scan common IoT ports
    const iotPorts = [
      { port: 1883, protocol: 'mqtt', name: 'MQTT' },
      { port: 8883, protocol: 'mqtt', name: 'MQTT (TLS)' },
      { port: 5683, protocol: 'coap', name: 'CoAP' },
      { port: 502, protocol: 'modbus', name: 'Modbus' },
      { port: 80, protocol: 'http', name: 'HTTP' },
      { port: 443, protocol: 'http', name: 'HTTPS' },
      { port: 8080, protocol: 'http', name: 'HTTP Alt' },
      { port: 8443, protocol: 'http', name: 'HTTPS Alt' }
    ];
    
    const subnet = options.subnet || '192.168.1';
    const startHost = options.startHost || 1;
    const endHost = options.endHost || 254;
    const timeout = options.timeout || 500;
    
    const scanHost = async (host) => {
      const results = [];
      
      for (const { port, protocol, name } of iotPorts) {
        try {
          const isOpen = await this.checkPort(host, port, timeout);
          if (isOpen) {
            results.push({
              host,
              port,
              protocol,
              name,
              discovered: new Date().toISOString()
            });
          }
        } catch (e) {
          // Port closed or filtered
        }
      }
      
      return results;
    };
    
    // Scan in batches
    const batchSize = 10;
    for (let i = startHost; i <= endHost; i += batchSize) {
      const batch = [];
      for (let j = i; j < Math.min(i + batchSize, endHost + 1); j++) {
        batch.push(scanHost(`${subnet}.${j}`));
      }
      
      const results = await Promise.all(batch);
      for (const hostResults of results) {
        discovered.push(...hostResults);
      }
      
      this.emit('discoveryProgress', {
        scanned: Math.min(i + batchSize - startHost, endHost - startHost + 1),
        total: endHost - startHost + 1,
        found: discovered.length
      });
    }
    
    return discovered;
  }

  checkPort(host, port, timeout = 1000) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeout);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.connect(port, host);
    });
  }

  // API Integration
  registerAPI(id, config) {
    return this.registerDevice(id, {
      name: config.name || id,
      type: 'api',
      protocol: 'http',
      host: config.host || new URL(config.baseUrl).hostname,
      port: config.port || (config.baseUrl?.startsWith('https') ? 443 : 80),
      credentials: {
        baseUrl: config.baseUrl,
        headers: config.headers || {},
        auth: config.auth
      },
      metadata: {
        endpoints: config.endpoints || [],
        documentation: config.documentation
      }
    });
  }

  async callAPI(deviceId, endpoint, method = 'GET', data = null) {
    const device = this.devices.get(deviceId);
    if (!device || device.type !== 'api') {
      throw new Error(`API '${deviceId}' not found`);
    }
    
    if (device.status !== 'connected') {
      await this.connectDevice(deviceId);
    }
    
    const connection = this.connections.get(deviceId);
    
    switch (method.toUpperCase()) {
      case 'GET':
        return await connection.get(endpoint, data);
      case 'POST':
        return await connection.post(endpoint, data);
      case 'PUT':
        return await connection.put(endpoint, data);
      case 'DELETE':
        return await connection.delete(endpoint);
      default:
        throw new Error(`Method '${method}' not supported`);
    }
  }
}

// Singleton instance
const iotManager = new IoTManager();

module.exports = { IoTManager, iotManager };