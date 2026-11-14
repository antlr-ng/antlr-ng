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
