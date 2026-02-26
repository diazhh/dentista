// Mock for @whiskeysockets/baileys - prevents ESM import issues in Jest
const makeWASocket = jest.fn();
export default makeWASocket;
export const DisconnectReason = {};
export const useMultiFileAuthState = jest.fn();
export const proto = {};
export type WASocket = any;
export type ConnectionState = any;
