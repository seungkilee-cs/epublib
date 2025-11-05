import { IFileAdapter, FileOpenOptions, FileData, FileSaveOptions } from "@epub-reader/core";

interface FileSystemHandle {
  readonly kind: "file" | "directory";
  readonly name: string;
}

interface FileSystemFileHandle extends FileSystemHandle {
  getFile(): Promise<File>;
  createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: Blob | BufferSource | string): Promise<void>;
  close(): Promise<void>;
}

type FilePickerWindow = Window &
  typeof globalThis & {
    showOpenFilePicker?: (options?: {
      multiple?: boolean;
      types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle>;
  };

const getFilePickerWindow = (): FilePickerWindow => window as FilePickerWindow;

function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

async function pickFiles(options?: FileOpenOptions): Promise<File[]> {
  const pickerWindow = getFilePickerWindow();

  if (pickerWindow.showOpenFilePicker) {
    const handles = await pickerWindow.showOpenFilePicker({
      multiple: options?.multiple ?? false,
      types: options?.accept
        ? [
            {
              description: "Files",
              accept: {
                "application/octet-stream": options.accept,
              },
            },
          ]
        : undefined,
    });

    const files = await Promise.all(handles.map((handle: FileSystemFileHandle) => handle.getFile()));
    return files;
  }

  return new Promise<File[]>((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = options?.multiple ?? false;
    if (options?.accept?.length) {
      input.accept = options.accept.join(",");
    }

    input.onchange = () => {
      if (!input.files) {
        resolve([]);
        return;
      }
      resolve(Array.from(input.files));
    };

    input.onerror = () => {
      reject(new Error("File selection cancelled"));
    };

    input.click();
  });
}

export class BrowserFileAdapter implements IFileAdapter {
  async openFile(options?: FileOpenOptions): Promise<FileData> {
    const files = await pickFiles({ ...options, multiple: false });
    const file = files[0];
    if (!file) {
      throw new Error("No file selected");
    }

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      data: await fileToArrayBuffer(file),
    };
  }

  async openMultipleFiles(options?: FileOpenOptions): Promise<FileData[]> {
    const files = await pickFiles({ ...options, multiple: true });
    return Promise.all(
      files.map(async (file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        data: await fileToArrayBuffer(file),
      }))
    );
  }

  async saveFile(data: Blob, filename: string, options?: FileSaveOptions): Promise<void> {
    const pickerWindow = getFilePickerWindow();

    if (pickerWindow.showSaveFilePicker) {
      const handle = await pickerWindow.showSaveFilePicker({
        suggestedName: filename,
        types: options?.filters?.map((filter) => ({
          description: filter.name,
          accept: {
            "application/octet-stream": filter.extensions.map((ext) => `.${ext}`),
          },
        })),
      });
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
      return;
    }

    const url = URL.createObjectURL(data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
