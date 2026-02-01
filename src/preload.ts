import { contextBridge, ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

// Promisify fs functions
const writeFileAsync = (filePath: string, data: Buffer): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const mkdirAsync = (dirPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.mkdir(dirPath, { recursive: true }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: () => ipcRenderer.invoke('get-sources'),
  
  saveRecording: async (blob: Blob, folderName: string, fileName: string): Promise<string> => {
    const buffer = Buffer.from(await blob.arrayBuffer());
    const folderPath = path.join(process.cwd(), 'videos', folderName);
    
    await mkdirAsync(folderPath);
    const filePath = path.join(folderPath, fileName);
    await writeFileAsync(filePath, buffer);
    
    return folderPath;
  },
  
  generateUUID: (): string => uuidv4()
});
