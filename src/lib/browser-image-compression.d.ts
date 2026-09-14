// Type declaration for browser-image-compression module
declare module "browser-image-compression" {
  interface Options {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    fileType?: string;
  }
  function imageCompression(file: File, options?: Options): Promise<File>;
  export default imageCompression;
}
