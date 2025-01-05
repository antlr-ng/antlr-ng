/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: disable

export interface PositionTrackingStream<T> {
    /**
     * Returns an element containing concrete information about the current
     * position in the stream.
     *
     * @param allowApproximateLocation if {@code false}, this method returns
     * {@code null} if an element containing exact information about the current
     * position is not available
     */
    getKnownPositionElement(allowApproximateLocation: boolean): T | null;

    /**
     * Determines if the specified {@code element} contains concrete position
     * information.
     *
     * @param element the element to check
     * @returns `true` if `element` contains concrete position information, otherwise `false`
     */
    hasPositionInformation(element: T): boolean;
}
