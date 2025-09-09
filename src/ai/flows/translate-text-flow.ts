
'use server';

/**
 * @fileOverview A flow for translating text into a specified language.
 *
 * - translateText - Translates text to a target language.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  sourceLanguage: z.string().describe('The language of the text to be translated (e.g., "English", "Spanish").'),
  targetLanguage: z.string().describe('The language to translate the text into (e.g., "Spanish", "French", "Hindi").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  correctedSourceText: z.string().describe('The original text, corrected for any grammatical errors or typos.'),
  translatedText: z.string().describe('The main, most accurate, and formal translation of the text.'),
  regionalTranslation: z.string().optional().describe('The translation in a specific regional accent, if applicable (e.g., Braj Bhasha).'),
  suggestions: z.array(z.string()).describe('A list of alternative translations or related phrases. If a regional dialect is requested, these suggestions should also be in that dialect.'),
  examples: z.array(z.object({
    original: z.string().describe('An example sentence in the source language using the original text.'),
    translated: z.string().describe('The translation of the example sentence in the target language.'),
  })).describe('A list of example sentences demonstrating usage.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;


const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `You are an expert translator. Your task is to translate the given text from a source language to a target language.

You must provide the following:
1.  First, correct any spelling or grammatical mistakes in the original source text.
2.  Provide the primary, most accurate, and formal translation.
3.  A list of 2-3 alternative translations or suggestions for the user.
4.  Two example sentences showing the original text in a sentence and its corresponding translation.

Translate the following text from {{sourceLanguage}} to {{targetLanguage}}.

Text to translate:
"{{text}}"

IMPORTANT: If the target language is Hindi, you must provide TWO translations:
1.  'translatedText': A standard, formal Hindi translation.
2.  'regionalTranslation': A casual, conversational translation using a Braj Bhasha (Vrajvasi) accent and phrasing.
3.  The 'suggestions' should also be in the Braj Bhasha (Vrajvasi) regional style.

Return ONLY the structured JSON output with no additional commentary.
`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}
