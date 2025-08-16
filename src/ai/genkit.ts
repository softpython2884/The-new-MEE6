import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
});

// Define a model cascade for resilience against quota errors.
// Tries the most powerful models first, then falls back to lighter ones.
export const textModelCascade = [
    'googleai/gemini-2.5-flash',
    'googleai/gemini-2.0-flash',
];

export const imageModel = 'googleai/gemini-2.0-flash-preview-image-generation';
