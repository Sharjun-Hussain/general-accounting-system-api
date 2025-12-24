/**
 * Converts a string from camelCase to snake_case.
 */
export function camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Converts a string from snake_case to camelCase.
 */
export function snakeToCamel(str: string): string {
    return str.replace(/(_\w)/g, (m) => m[1].toUpperCase());
}

/**
 * Converts object keys from camelCase to snake_case.
 */
export function keysToSnake(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map((v) => keysToSnake(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [camelToSnake(key)]: keysToSnake(obj[key]),
            }),
            {}
        );
    }
    return obj;
}

/**
 * Converts object keys from snake_case to camelCase.
 */
export function keysToCamel(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map((v) => keysToCamel(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [snakeToCamel(key)]: keysToCamel(obj[key]),
            }),
            {}
        );
    }
    return obj;
}
