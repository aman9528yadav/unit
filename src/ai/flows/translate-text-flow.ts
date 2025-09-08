
'use server';

/**
 * @fileOverview A flow for translating text into a specified language and providing suggestions.
 *
 * - translateText - Translates text to a target language and suggests alternatives.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.string().describe('The language to translate the text into (e.g., "Spanish", "French", "Hindi").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const SuggestionSchema = z.object({
    word: z.string().describe("The suggested word or phrase."),
    meaning: z.object({
        sourceLanguage: z.string().describe("The meaning of the word in the original (source) language."),
        targetLanguage: z.string().describe("The meaning of the word in the new (target) language.")
    }).describe("The meaning or context for the suggestion in both languages."),
    example: z.object({
        sourceLanguage: z.string().describe("An example sentence using the word in the original (source) language."),
        targetLanguage: z.string().describe("An example sentence using the word in the new (target) language.")
    }).describe("Example sentences for the suggestion in both languages.").optional(),
});

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
  suggestions: z.array(SuggestionSchema).describe("A list of alternative words or phrases for the translated text, along with their meanings and example sentences.").optional(),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;


const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `Translate the following text into {{targetLanguage}}.

Text to translate:
"{{text}}"

After providing the primary translation in the 'translatedText' field, also provide a few alternative word or phrase suggestions in the 'suggestions' array. 
For each suggestion, provide the word itself. Then, provide its meaning in BOTH the original source language and the target language within the 'meaning' object.
Finally, provide an example sentence for the word in BOTH languages within the 'example' object.
If no suggestions are applicable, return an empty array for suggestions.
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
