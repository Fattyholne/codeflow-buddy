
import { streamAudioData, streamVideoFrame, streamScreenFrame } from '../lib/socketClient';

export class MediaHandler {
    private audioStream: MediaStream | null = null;
    private videoStream: MediaStream | null = null;
    private screenStream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private audioProcessor: ScriptProcessorNode | null = null;
    private audioFrameInterval: number | null = null;
    private videoFrameInterval: number | null = null;
    private screenFrameInterval: number | null = null;
    
    async startAudioCapture(): Promise<void> {
        try {
            console.log('[Media] Requesting microphone access...');
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000 // Ensure 16kHz sample rate
                }
            });
            
            // Create audio processor
            this.audioContext = new AudioContext({ sampleRate: 16000 }); // Set sample rate here
            const source = this.audioContext.createMediaStreamSource(this.audioStream);
            this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
            
            this.audioProcessor.onaudioprocess = (e) => {
                const audioData = e.inputBuffer.getChannelData(0);
                this.sendAudioData(audioData);
            };
            
            source.connect(this.audioProcessor);
            this.audioProcessor.connect(this.audioContext.destination);
            
            console.log('[Media] Microphone capture started');
        } catch (error) {
            console.error('[Media] Microphone access failed:', error);
            this.stopAudioCapture();
            throw error;
        }
    }
    
    private async sendAudioData(audioData: Float32Array) {
        try {
            // Convert Float32Array to Int16Array (required by Live API)
            const int16AudioData = this.floatTo16BitPCM(audioData);
            
            // Create a Blob from the Int16Array (raw PCM data)
            const audioBlob = new Blob([int16AudioData], { type: 'audio/pcm' }); // Changed to audio/pcm
            await streamAudioData(audioBlob);
        } catch (error) {
            console.error('[Media] Failed to send audio data:', error);
        }
    }
    
    private floatTo16BitPCM(input: Float32Array): Int16Array {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output;
    }
    
    async startVideoCapture(): Promise<void> {
        try {
            console.log('[Media] Requesting camera access...');
            this.videoStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                }
            });
            
            // Create video processor
            const videoTrack = this.videoStream.getVideoTracks()[0];
            
            // Check if ImageCapture is supported
            if (!window.ImageCapture) {
                throw new Error("ImageCapture API is not supported in this browser");
            }
            
            const imageCapture = new window.ImageCapture(videoTrack);
            
            // Capture frames periodically
            this.videoFrameInterval = window.setInterval(async () => {
                if (this.videoStream) {
                    try {
                        const frame = await imageCapture.grabFrame();
                        await this.sendVideoFrame(frame);
                    } catch (error) {
                        console.error('[Media] Error grabbing video frame:', error);
                    }
                }
            }, 1000 / 5); // 5 fps to reduce bandwidth
            
            console.log('[Media] Camera capture started');
        } catch (error) {
            console.error('[Media] Camera access failed:', error);
            this.stopVideoCapture();
            throw error;
        }
    }
    
    private async sendVideoFrame(frame: ImageBitmap) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = frame.width;
            canvas.height = frame.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(frame, 0, 0);
                
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        await streamVideoFrame(blob);
                    }
                }, 'image/jpeg', 0.7); // Lower quality for better performance
            }
        } catch (error) {
            console.error('[Media] Failed to send video frame:', error);
        }
    }
    
    async startScreenCapture(): Promise<void> {
        try {
            console.log('[Media] Requesting screen share access...');
            this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    // Remove the cursor property as it's not supported in MediaTrackConstraints
                    // Use displaySurface and logicalSurface instead (supported properties)
                    displaySurface: "monitor" as any,
                    logicalSurface: true as any
                },
                audio: false
            });
            
            const videoTrack = this.screenStream.getVideoTracks()[0];
            
            // Check if ImageCapture is supported
            if (!window.ImageCapture) {
                throw new Error("ImageCapture API is not supported in this browser");
            }
            
            const imageCapture = new window.ImageCapture(videoTrack);
            
            // Capture frames periodically
            this.screenFrameInterval = window.setInterval(async () => {
                if (this.screenStream) {
                    try {
                        const frame = await imageCapture.grabFrame();
                        await this.sendScreenFrame(frame);
                    } catch (error) {
                        console.error('[Media] Error grabbing screen frame:', error);
                    }
                }
            }, 1000); // 1 frame per second for screen share
            
            console.log('[Media] Screen capture started');
        } catch (error) {
            console.error('[Media] Screen share access failed:', error);
            this.stopScreenCapture();
            throw error;
        }
    }
    
    private async sendScreenFrame(frame: ImageBitmap) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = frame.width;
            canvas.height = frame.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(frame, 0, 0);
                
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        await streamScreenFrame(blob);
                    }
                }, 'image/jpeg', 0.7); // Lower quality for better performance
            }
        } catch (error) {
            console.error('[Media] Failed to send screen frame:', error);
        }
    }
    
    stopAll(): void {
        this.stopAudioCapture();
        this.stopVideoCapture();
        this.stopScreenCapture();
        console.log('[Media] All captures stopped');
    }

    stopAudioCapture(): void {
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        if (this.audioProcessor) {
            this.audioProcessor.disconnect();
            this.audioProcessor = null;
        }
        console.log('[Media] Audio capture stopped');
    }

    stopVideoCapture(): void {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }
        if (this.videoFrameInterval !== null) {
            clearInterval(this.videoFrameInterval);
            this.videoFrameInterval = null;
        }
        console.log('[Media] Video capture stopped');
    }

    stopScreenCapture(): void {
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
        }
        if (this.screenFrameInterval !== null) {
            clearInterval(this.screenFrameInterval);
            this.screenFrameInterval = null;
        }
        console.log('[Media] Screen capture stopped');
    }
}
