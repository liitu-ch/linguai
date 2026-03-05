/**
 * AudioWorklet processor that captures microphone audio,
 * resamples from the AudioContext sample rate to 24kHz,
 * and converts to PCM16 (Int16Array) for the OpenAI Realtime API.
 */
class PCM16Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    // Send audio every ~100ms (2400 samples at 24kHz)
    this._chunkSize = 2400;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0]; // mono
    const inputRate = sampleRate; // AudioContext sample rate
    const outputRate = 24000;

    // Resample if needed
    let samples;
    if (inputRate === outputRate) {
      samples = channelData;
    } else {
      const ratio = inputRate / outputRate;
      const outputLength = Math.floor(channelData.length / ratio);
      samples = new Float32Array(outputLength);
      for (let i = 0; i < outputLength; i++) {
        samples[i] = channelData[Math.floor(i * ratio)];
      }
    }

    // Accumulate samples
    for (let i = 0; i < samples.length; i++) {
      this._buffer.push(samples[i]);
    }

    // When we have enough, send a chunk
    while (this._buffer.length >= this._chunkSize) {
      const chunk = this._buffer.splice(0, this._chunkSize);
      const pcm16 = new Int16Array(chunk.length);
      for (let i = 0; i < chunk.length; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    }

    return true;
  }
}

registerProcessor("pcm16-processor", PCM16Processor);
