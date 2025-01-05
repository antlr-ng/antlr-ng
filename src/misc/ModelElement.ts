/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

const modelElementSymbol = Symbol("ModelElement");

/**
 * Marks a field as being a model element for output generation.
 *
 * @param target The target field (unused).
 * @param context The context of the field.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ModelElement = <T, This>(target: undefined, context: ClassFieldDecoratorContext<This, T>): void => {
    context.addInitializer(function (this: This) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const constructor = Object.getPrototypeOf(this).constructor as {
            [modelElementSymbol]?: Set<string | symbol>;
        };

        if (!constructor[modelElementSymbol]) {
            constructor[modelElementSymbol] = new Set();
        }

        constructor[modelElementSymbol].add(context.name);
    });
};

export const isModelElement = (instance: unknown, fieldName: string | symbol): boolean => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const constructor = Object.getPrototypeOf(instance).constructor as {
        [modelElementSymbol]?: Set<string | symbol>;
    };

    return constructor[modelElementSymbol]?.has(fieldName) ?? false;
};
