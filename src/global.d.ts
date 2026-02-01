export {};

declare global {
  interface Window {
    electronAPI: {
      getSources: () => Promise<any[]>;
      saveRecording: (blob: Blob, folderName: string, fileName: string) => Promise<string>;
      generateUUID: () => string;
    };
  }
}
