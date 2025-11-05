/* ==========================================
   ENCRYPTION UTILITIES
   Simple encryption for localStorage data
   ========================================== */

/*
 * EXPLANATION FOR BEGINNERS:
 * This uses the built-in Web Crypto API to encrypt data
 * Think of it like putting your data in a locked safe
 * Only someone with the key (password) can unlock it
 */

const CryptoUtils = {

    // Generate a key from a password
    // This turns "myPassword123" into a cryptographic key
    async generateKey(password) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        // Hash the password to create a consistent key
        const keyMaterial = await crypto.subtle.digest('SHA-256', passwordBuffer);

        return keyMaterial;
    },

    // Encrypt data
    async encrypt(data, password) {
        try {
            // Convert data to string if it's an object
            const dataString = typeof data === 'string' ? data : JSON.stringify(data);

            // Generate encryption key from password
            const key = await this.generateKey(password);

            // Create a random initialization vector (IV)
            // This makes sure the same data encrypted twice looks different
            const iv = crypto.getRandomValues(new Uint8Array(12));

            // Import the key for AES-GCM encryption
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                key,
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );

            // Encrypt the data
            const encoder = new TextEncoder();
            const encodedData = encoder.encode(dataString);

            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                cryptoKey,
                encodedData
            );

            // Combine IV and encrypted data
            // We need the IV later to decrypt
            const combined = new Uint8Array(iv.length + encryptedData.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encryptedData), iv.length);

            // Convert to base64 string for storage
            return this.arrayBufferToBase64(combined);

        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    },

    // Decrypt data
    async decrypt(encryptedData, password) {
        try {
            // Convert base64 back to array
            const combined = this.base64ToArrayBuffer(encryptedData);

            // Extract IV (first 12 bytes) and encrypted data
            const iv = combined.slice(0, 12);
            const data = combined.slice(12);

            // Generate the same key from password
            const key = await this.generateKey(password);

            // Import the key
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                key,
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );

            // Decrypt the data
            const decryptedData = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                cryptoKey,
                data
            );

            // Convert back to string
            const decoder = new TextDecoder();
            const decryptedString = decoder.decode(decryptedData);

            // Try to parse as JSON, otherwise return as string
            try {
                return JSON.parse(decryptedString);
            } catch {
                return decryptedString;
            }

        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data - wrong password or corrupted data');
        }
    },

    // Helper: Convert ArrayBuffer to Base64
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    // Helper: Convert Base64 to ArrayBuffer
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
};

/* ==========================================
   SECURE STORAGE WRAPPER
   Easy-to-use encrypted localStorage
   ========================================== */

const SecureStorage = {

    // The encryption password - generated from device fingerprint
    // In a real app, this could be derived from user's master password
    encryptionKey: null,

    // Initialize encryption key
    async init() {
        // Get or create a device-specific key
        let deviceKey = localStorage.getItem('_device_key');

        if (!deviceKey) {
            // Generate a random key for this device
            deviceKey = this.generateDeviceKey();
            localStorage.setItem('_device_key', deviceKey);
        }

        this.encryptionKey = deviceKey;
    },

    // Generate a random device key
    generateDeviceKey() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    // Save encrypted data
    async setItem(key, value) {
        if (!this.encryptionKey) await this.init();

        try {
            const encrypted = await CryptoUtils.encrypt(value, this.encryptionKey);
            localStorage.setItem(key, encrypted);
            return true;
        } catch (error) {
            console.error('SecureStorage setItem error:', error);
            return false;
        }
    },

    // Get and decrypt data
    async getItem(key) {
        if (!this.encryptionKey) await this.init();

        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;

        try {
            return await CryptoUtils.decrypt(encrypted, this.encryptionKey);
        } catch (error) {
            console.error('SecureStorage getItem error:', error);
            return null;
        }
    },

    // Remove item
    removeItem(key) {
        localStorage.removeItem(key);
    },

    // Check if key exists
    hasItem(key) {
        return localStorage.getItem(key) !== null;
    }
};

// Initialize on load
SecureStorage.init();
