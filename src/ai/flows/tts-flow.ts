
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'node-wav';
import { googleAI } from '@genkit-ai/googleai';

const TtsInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});

const TtsOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio as a data URI.'),
});

export type TtsInput = z.infer<typeof TtsInputSchema>;
export type TtsOutput = z.infer<typeof TtsOutputSchema>;

function pcmToWav(pcmData: Buffer, sampleRate: number, channels: number): Buffer {
    const float32Array = new Float32Array(pcmData.buffer, pcmData.byteOffset, pcmData.length / Float32Array.BYTES_PER_ELEMENT);
    return wav.encode([float32Array], { sampleRate, float: true, bitDepth: 32, channels });
}

export const ttsFlow = ai.defineFlow(
  {
    name: 'ttsFlow',
    inputSchema: TtsInputSchema,
    outputSchema: TtsOutputSchema,
  },
  async ({ text }) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
          // Gemini returns raw PCM audio data, which needs to be encoded into a WAV file.
          // We specify the sample rate here to ensure the data is in the expected format.
          audioEncoding: 'LINEAR16',
          sampleRateHertz: 24000, 
        },
      },
      prompt: text,
    });

    if (!media?.url) {
      throw new Error('TTS generation failed or returned no media.');
    }
    
    // The data URI from Gemini for LINEAR16 is raw PCM data.
    const pcmBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    // We need to encode this raw PCM data into a proper WAV file format.
    const wavBuffer = wav.encode([new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.length / 2)], {
        sampleRate: 24000,
        bitDepth: 16,
        channels: 1
    });
    
    const wavBase64 = wavBuffer.toString('base64');

    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
