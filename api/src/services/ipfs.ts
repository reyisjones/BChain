import FormData from 'form-data';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

/**
 * IPFS Service using Pinata API v2
 * Docs: https://docs.pinata.cloud/api-reference
 */
export class IPFSService {
  private readonly pinataJWT: string;
  private readonly baseUrl = 'https://api.pinata.cloud';
  
  constructor(jwt?: string) {
    this.pinataJWT = jwt || process.env.PINATA_JWT || '';
    
    if (!this.pinataJWT) {
      console.warn('⚠️  PINATA_JWT not configured - IPFS uploads will fail');
    }
  }

  /**
   * Upload file to IPFS via Pinata
   * @param filePath - Path to file to upload
   * @param metadata - Optional metadata for the file
   * @returns IPFS CID
   */
  async uploadFile(filePath: string, metadata?: { name?: string; keyvalues?: Record<string, any> }): Promise<string> {
    if (!this.pinataJWT) {
      throw new Error('PINATA_JWT not configured');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    if (metadata) {
      const pinataMetadata = {
        name: metadata.name || path.basename(filePath),
        keyvalues: metadata.keyvalues || {}
      };
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
    }

    const options = {
      pinataOptions: {
        cidVersion: 1
      }
    };
    formData.append('pinataOptions', JSON.stringify(options));

    try {
      const response = await fetch(`${this.baseUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.pinataJWT}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pinata upload failed: ${response.status} ${error}`);
      }

      const result = await response.json();
      return result.IpfsHash; // CID
    } catch (error: any) {
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * Upload buffer to IPFS via Pinata
   * @param buffer - File buffer
   * @param filename - Name for the file
   * @param metadata - Optional metadata
   * @returns IPFS CID
   */
  async uploadBuffer(buffer: Buffer, filename: string, metadata?: { keyvalues?: Record<string, any> }): Promise<string> {
    if (!this.pinataJWT) {
      throw new Error('PINATA_JWT not configured');
    }

    const formData = new FormData();
    formData.append('file', buffer, { filename });

    if (metadata) {
      const pinataMetadata = {
        name: filename,
        keyvalues: metadata.keyvalues || {}
      };
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
    }

    const options = {
      pinataOptions: {
        cidVersion: 1
      }
    };
    formData.append('pinataOptions', JSON.stringify(options));

    try {
      const response = await fetch(`${this.baseUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.pinataJWT}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pinata upload failed: ${response.status} ${error}`);
      }

      const result = await response.json();
      return result.IpfsHash; // CID
    } catch (error: any) {
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * Upload JSON object to IPFS via Pinata
   * @param jsonObject - Object to upload as JSON
   * @param name - Name for the JSON file
   * @returns IPFS CID
   */
  async uploadJSON(jsonObject: any, name?: string): Promise<string> {
    if (!this.pinataJWT) {
      throw new Error('PINATA_JWT not configured');
    }

    const body = {
      pinataContent: jsonObject,
      pinataMetadata: {
        name: name || `metadata-${Date.now()}.json`
      },
      pinataOptions: {
        cidVersion: 1
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.pinataJWT}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pinata JSON upload failed: ${response.status} ${error}`);
      }

      const result = await response.json();
      return result.IpfsHash; // CID
    } catch (error: any) {
      throw new Error(`IPFS JSON upload failed: ${error.message}`);
    }
  }

  /**
   * Get IPFS gateway URL for a CID
   * @param cid - IPFS Content Identifier
   * @param gateway - Optional custom gateway (defaults to Pinata)
   * @returns Full URL to access the content
   */
  getGatewayURL(cid: string, gateway?: string): string {
    const defaultGateway = 'https://gateway.pinata.cloud/ipfs';
    return `${gateway || defaultGateway}/${cid}`;
  }

  /**
   * Check if IPFS service is configured
   * @returns true if JWT is set
   */
  isConfigured(): boolean {
    return !!this.pinataJWT;
  }

  /**
   * Test connection to Pinata API
   * @returns true if authenticated successfully
   */
  async testConnection(): Promise<boolean> {
    if (!this.pinataJWT) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/data/testAuthentication`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.pinataJWT}`
        }
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export default IPFSService;
