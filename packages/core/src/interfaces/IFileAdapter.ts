export interface FileOpenOptions {
  accept?: string[];
  multiple?: boolean;
}

export interface FileSaveOptions {
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}

export interface FileData {
  name: string;
  data: ArrayBuffer;
  size: number;
  type: string;
}

export interface IFileAdapter {
  openFile(options?: FileOpenOptions): Promise<FileData>;
  openMultipleFiles(options?: FileOpenOptions): Promise<FileData[]>;
  saveFile(data: Blob, filename: string, options?: FileSaveOptions): Promise<void>;
}
