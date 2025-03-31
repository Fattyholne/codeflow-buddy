
/// <reference types="vite/client" />

// Add ImageCapture API type definitions
interface ImageCapture {
  grabFrame(): Promise<ImageBitmap>;
  takePhoto(): Promise<Blob>;
}

declare global {
  interface Window {
    ImageCapture: {
      prototype: ImageCapture;
      new(track: MediaStreamTrack): ImageCapture;
    };
  }
}
