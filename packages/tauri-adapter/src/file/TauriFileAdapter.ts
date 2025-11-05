import {
  FileData,
  FileOpenOptions,
  FileSaveOptions,
  IFileAdapter,
} from "@epub-reader/core";
import { open, save } from "@tauri-apps/api/dialog";
import { readBinaryFile, writeBinaryFile } from "@tauri-apps/api/fs";
import { basename } from "@tauri-apps/api/path";

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return buffer;
}

function mapOpenFilters(options?: FileOpenOptions) {
  if (!options?.accept?.length) {
    return undefined;
  }

  return options.accept.map((entry) => ({
    name: entry,
    extensions: [entry.replace(/^\./, "")],
  }));
}

function mapSaveFilters(options?: FileSaveOptions) {
  return options?.filters?.map((filter) => ({
    name: filter.name,
    extensions: filter.extensions,
  }));
}

export class TauriFileAdapter implements IFileAdapter {
  async openFile(options?: FileOpenOptions): Promise<FileData> {
    const selected = await open({
      multiple: false,
      filters: mapOpenFilters(options),
    });

    if (!selected) {
      throw new Error("File selection cancelled");
    }

    const filePath = Array.isArray(selected) ? selected[0] : selected;
    const content = await readBinaryFile(filePath);

    return {
      name: await basename(filePath),
      data: toArrayBuffer(content),
      size: content.byteLength,
      type: "application/octet-stream",
    };
  }

  async openMultipleFiles(options?: FileOpenOptions): Promise<FileData[]> {
    const selected = await open({
      multiple: true,
      filters: mapOpenFilters(options),
    });

    const paths = Array.isArray(selected) ? selected : selected ? [selected] : [];

    const files = await Promise.all(
      paths.map(async (filePath) => {
        const content = await readBinaryFile(filePath);

        return {
          name: await basename(filePath),
          data: toArrayBuffer(content),
          size: content.byteLength,
          type: "application/octet-stream",
        } as FileData;
      })
    );

    return files;
  }

  async saveFile(data: Blob, filename: string, options?: FileSaveOptions): Promise<void> {
    const targetPath = await save({
      defaultPath: options?.defaultPath ?? filename,
      filters: mapSaveFilters(options),
    });

    if (!targetPath) {
      return;
    }

    const buffer = await data.arrayBuffer();
    await writeBinaryFile({ path: targetPath, contents: new Uint8Array(buffer) });
  }
}
