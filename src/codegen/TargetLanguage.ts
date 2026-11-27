/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

export const targetLanguages = [
    "Cpp", "CSharp", "Dart", "Go", "Java", "PHP", "Python3", "Swift", "TypeScript"
] as const;

export type SupportedLanguage = typeof targetLanguages[number];

export const noTargetLanguage = "None";

export type NoLanguage = typeof noTargetLanguage;

export type ToolLanguage = SupportedLanguage | NoLanguage;

/**
 * Determines whether a target generator generates code for a language, as given in the `language` grammar option.
 * The language is compared with the generator's language name and its language specifiers, without case.
 *
 * @param generator The target generator to check.
 * @param generator.language The language name of the generator.
 * @param generator.languageSpecifiers Other names of the language.
 * @param language The language to check.
 *
 * @returns True if the generator generates code for the language.
 */
export const supportsLanguage = (generator: { language: string, languageSpecifiers: string[]; },
    language: string): boolean => {
    const name = language.toLowerCase();

    return generator.language.toLowerCase() === name || generator.languageSpecifiers.some((specifier) => {
        return specifier.toLowerCase() === name;
    });
};
