/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

export class TokenInfo {
    public readonly type: number;
    public readonly name: string;

    public constructor(type: number, name: string) {
        this.type = type;
        this.name = name;
    }

    public toString(): string {
        return "TokenInfo{" +
            "type=" + this.type +
            ", name='" + this.name + "'" +
            "}";
    }
}
