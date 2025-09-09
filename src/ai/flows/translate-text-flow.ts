
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
  translatedText: z.string().describe('The main, most accurate translation of the text.'),
  suggestions: z.array(z.string()).describe('A list of alternative translations or related phrases.'),
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
1.  The primary, most accurate translation.
2.  A list of 2-3 alternative translations or suggestions for the user.
3.  Two example sentences showing the original text in a sentence and its corresponding translation.

Translate the following text from {{sourceLanguage}} to {{targetLanguage}}.
{{#if (eq targetLanguage "Hindi")}}
Please ensure the Hindi translation uses a natural, conversational Indian accent and phrasing.
{{/if}}

Text to translate:
"{{text}}"

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
