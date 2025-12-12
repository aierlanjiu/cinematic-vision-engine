
// Type definitions for Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
        };
      };
    };
  }
}

const HISTORY_FILE_NAME = 'cve_history.json';
const GALLERY_FOLDER_NAME = 'Cinematic_Vision_Gallery';

export class DriveService {
  private tokenClient: any;
  private accessToken: string | null = null;
  private clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  public init() {
    if (!window.google) return;

    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            this.accessToken = tokenResponse.access_token;
          }
        },
      });
    } catch (e) {
      console.error("Failed to init Google Token Client", e);
    }
  }

  public async signIn(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        this.init();
        if (!this.tokenClient) {
          reject('Google Identity SDK not loaded.');
          return;
        }
      }

      // Override callback for the promise
      this.tokenClient.callback = (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(tokenResponse);
        } else {
          this.accessToken = tokenResponse.access_token;
          resolve(tokenResponse.access_token);
        }
      };

      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  public get isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // --- FILE HELPERS ---

  private async findFile(name: string, trashed: boolean = false, mimeType?: string): Promise<string | null> {
    if (!this.accessToken) throw new Error('Not authenticated');

    let query = `name = '${name}' and trashed = ${trashed}`;
    if (mimeType) {
      query += ` and mimeType = '${mimeType}'`;
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name)`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  }

  // --- FOLDER MANAGEMENT ---

  private async ensureFolder(folderName: string): Promise<string> {
    const existingId = await this.findFile(folderName, false, 'application/vnd.google-apps.folder');
    if (existingId) return existingId;

    // Create folder
    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: form
      }
    );
    const data = await response.json();
    return data.id;
  }

  // --- UPLOAD OPERATIONS ---

  private base64ToBlob(base64: string): Blob {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  }

  public async uploadImage(folderId: string, fileName: string, base64Data: string): Promise<void> {
    // Check if file already exists in folder to avoid duplicates (optional, simplistic check)
    // For batch uploads, we might skip this check for speed, but let's be safe.
    // Complex query: name = 'X' and 'folderId' in parents
    const query = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    const searchData = await searchRes.json();

    // If file exists, we can choose to skip or overwrite. Here we skip.
    if (searchData.files && searchData.files.length > 0) {
      console.log(`Skipping ${fileName}, already exists.`);
      return;
    }

    const blob = this.base64ToBlob(base64Data);
    const metadata = {
      name: fileName,
      parents: [folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: form
      }
    );
  }

  /**
   * Batch exports images to a specific folder, organized by serial number
   */
  public async exportGalleryToDrive(
    images: any[],
    onProgress: (current: number, total: number) => void
  ): Promise<void> {
    if (!this.accessToken) throw new Error('Not authenticated');

    const rootFolderId = await this.ensureFolder(GALLERY_FOLDER_NAME);

    // Group images by commonId
    const groupedImages = new Map<string, any[]>();
    for (const img of images) {
      const key = img.commonId || img.id;
      if (!groupedImages.has(key)) {
        groupedImages.set(key, []);
      }
      groupedImages.get(key)!.push(img);
    }

    let count = 0;
    const totalImages = images.length;
    let serialCounter = 1;

    // Process each group (each group gets its own serial number folder)
    for (const [commonId, groupImages] of groupedImages) {
      // Generate serial number for this batch
      const serial = `SMJN-${new Date().getFullYear()}-${serialCounter.toString().padStart(4, '0')}`;
      serialCounter++;

      // Create subfolder for this serial number
      const batchFolderId = await this.ensureFolderInParent(serial, rootFolderId);

      // Sort images within group by pipeline and aspect ratio
      const sortedGroupImages = [...groupImages].sort((a, b) => {
        const pipelineOrder = { 'A': 1, 'B': 2, 'C': 3 };
        const pipeA = pipelineOrder[a.pipeline as keyof typeof pipelineOrder] || 0;
        const pipeB = pipelineOrder[b.pipeline as keyof typeof pipelineOrder] || 0;
        if (pipeA !== pipeB) return pipeA - pipeB;
        return a.aspectRatio.localeCompare(b.aspectRatio);
      });

      // Upload images in this group
      for (let i = 0; i < sortedGroupImages.length; i++) {
        const img = sortedGroupImages[i];
        count++;
        onProgress(count, totalImages);

        // Naming Format: SMJN-2025-0001_PipelineA_9x16.png
        const pipe = img.pipeline ? `_Pipeline${img.pipeline}` : '';
        const ratio = img.aspectRatio.replace(':', 'x');
        const safeName = `${serial}${pipe}_${ratio}.png`;

        try {
          await this.uploadImage(batchFolderId, safeName, img.url);
        } catch (e) {
          console.error(`Failed to upload ${safeName}`, e);
        }
      }
    }
  }

  /**
   * Ensure a folder exists within a parent folder
   */
  private async ensureFolderInParent(folderName: string, parentId: string): Promise<string> {
    // Check if folder exists in parent
    const query = `name = '${folderName}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }

    // Create folder
    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));

    const createResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: form
      }
    );
    const createData = await createResponse.json();
    return createData.id;
  }

  // --- JSON HISTORY BACKUP ---

  public async saveHistoryJSON(data: any): Promise<void> {
    if (!this.accessToken) throw new Error('Not authenticated');

    const fileContent = JSON.stringify(data);
    const fileId = await this.findFile(HISTORY_FILE_NAME);

    const metadata = {
      name: HISTORY_FILE_NAME,
      mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent], { type: 'application/json' }));

    if (fileId) {
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${this.accessToken}` },
          body: form,
        }
      );
    } else {
      await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.accessToken}` },
          body: form,
        }
      );
    }
  }
}
