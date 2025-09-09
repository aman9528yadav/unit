'use server';

/**
 * @fileOverview A flow for converting text to speech.
 *
 * - textToSpeech - Converts text to audio data.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

export const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

export const TextToSpeechOutputSchema = z.object({
  media: z.string().describe('The audio data as a base64-encoded WAV data URI.'),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(
  input: TextToSpeechInput
): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

async function toWav(
  pcmData: ArrayBuffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      // In a Node.js environment, Buffer.concat is ideal.
      // For broader compatibility (like Edge runtime), we handle ArrayBuffers differently.
      let finalBuffer;
      if (typeof Buffer !== 'undefined') {
         finalBuffer = Buffer.concat(bufs);
      } else {
         // A simple polyfill-like approach for environments without Buffer
         const totalLength = bufs.reduce((acc, buf) => acc + buf.length, 0);
         finalBuffer = new Uint8Array(totalLength);
         let offset = 0;
         for (const buf of bufs) {
            finalBuffer.set(buf, offset);
            offset += buf.length;
         }
      }
      resolve(btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(finalBuffer)))));
    });

    writer.write(Buffer.from(pcmData));
    writer.end();
  });
}

// Helper function to decode base64 in a cross-platform way
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}


const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: input.text,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    
    const audioBuffer = base64ToArrayBuffer(
      media.url.substring(media.url.indexOf(',') + 1)
    );

    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);
