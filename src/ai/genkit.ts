import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
});

// Define a model cascade for resilience against quota errors.
export const textModelCascade = [
    'googleai/gemini-2.5-pro',
    'googleai/gemini-2.0-flash',
    'googleai/gemma-3' 
];

export const imageModel = 'googleai/gemini-2.0-flash-preview-image-generation';
