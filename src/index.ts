import type { ReadonlyDeep } from "type-fest";

function sortArrayMap<T, R>(array: T[], transform: (value: T) => R): R[] {
	if (array.length <= 1) {
		return array.map(transform);
	} else {
		const sorted = array.slice().sort();
		const result: R[] = new Array(sorted.length);

		for (let i = 0, len = sorted.length; i < len; i++) {
			result[i] = transform(sorted[i]);
		}

		return result;
	}
}

function sortObjectEntriesMap<T = any, R = any>(
	object: { [key: string]: T },
	transform: (entry: [string, T]) => R
): R[] {
	const keys = Object.keys(object);

	if (keys.length <= 1) {
		return keys.map((k) => transform([k, object[k]]));
	} else {
		keys.sort(); // Sort keys in place
		const results: R[] = new Array(keys.length);

		for (let i = 0, len = keys.length; i < len; i++) {
			const key = keys[i];
			results[i] = transform([key, object[key]]);
		}

		return results;
	}
}

function getConstructorName(value: object): string {
	return (value as any).constructor?.name ?? "Unknown";
}

interface CreateOptions {
	strict?: boolean;
}

export function createHaesh(options: CreateOptions = {}) {
	let index = 0;
	let idleId: number | null = null;
	let timeoutId: Timer | null = null; // Fallback for environments without requestIdleCallback

	const strict = options.strict ?? false;

	let object_referenceKey_Map = new WeakMap<object, string>();
	const objectSum_referenceKey_Map = new Map<string, string>();
	const referenceKey_object_Map = new Map<string, object>();
	const referenceKey_queue_Map = new Map<string, number>();

	function collectGarbage() {
		const now = Date.now();
		const keysToDelete: string[] = []; // Batch deletions to avoid potential issues during iteration
		referenceKey_queue_Map.forEach((diedAt, referenceKey) => {
			if (diedAt < now) {
				keysToDelete.push(referenceKey);
			}
		});
		keysToDelete.forEach((referenceKey) => {
			referenceKey_object_Map.delete(referenceKey);
			referenceKey_queue_Map.delete(referenceKey);
		});
	}

	function scheduledGarbageCollection() {
		if (typeof requestIdleCallback === "function") {
			if (idleId !== null) {
				cancelIdleCallback(idleId);
				idleId = null; // Reset idleId
			}
			idleId = requestIdleCallback(collectGarbage, { timeout: 1000 });
		} else {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			timeoutId = setTimeout(collectGarbage, 1000); // Fallback using setTimeout
		}
	}

	function setReferenceKeyMaxAge(referenceKey: string, maxAge: number) {
		if (maxAge === Infinity) {
			referenceKey_queue_Map.delete(referenceKey);
		} else {
			referenceKey_queue_Map.set(referenceKey, Date.now() + maxAge);
		}
	}

	function objectReferenceKey(
		value: object,
		maxAge: number,
		depth: number
	): string {
		const cachedKey = object_referenceKey_Map.get(value);

		if (cachedKey) {
			setReferenceKeyMaxAge(cachedKey, maxAge);

			return cachedKey;
		} else {
			let sum: string;
			let clone: any;

			if (Array.isArray(value)) {
				clone = [];
				const refKeys = sortArrayMap(value, (item) => {
					const refKey = referenceKeyOf(item, maxAge, depth + 1);
					// Use the cached frozen version if available.
					clone.push(referenceKey_object_Map.get(refKey) ?? item);

					return refKey;
				});
				sum = `[${refKeys.join(",")}]`;
			} else {
				clone = {};
				const entries = sortObjectEntriesMap(value, ([itemKey, itemValue]) => {
					const refKey = referenceKeyOf(itemValue, maxAge, depth + 1);
					clone[itemKey] = referenceKey_object_Map.get(refKey) ?? itemValue;

					return `${itemKey}:${refKey}`;
				});
				sum = `{${entries.join(",")}}`;
			}

			const existingRefKey = objectSum_referenceKey_Map.get(sum);

			if (existingRefKey) {
				if (
					strict &&
					depth > 0 &&
					referenceKey_object_Map.get(existingRefKey) !== value
				) {
					throw new Error(
						`[Strict Mode] Must be an already stored reference, got a new ${JSON.stringify(
							value
						)}`
					);
				}
				setReferenceKeyMaxAge(existingRefKey, maxAge);

				return existingRefKey;
			} else {
				if (strict && depth > 0) {
					throw new Error(
						`[Strict Mode] Must be an already stored reference, got a new ${JSON.stringify(
							value
						)}`
					);
				}
				const newReferenceKey = `#${index++}`;
				setReferenceKeyMaxAge(newReferenceKey, maxAge);
				object_referenceKey_Map.set(value, newReferenceKey);
				objectSum_referenceKey_Map.set(sum, newReferenceKey);
				referenceKey_object_Map.set(newReferenceKey, Object.freeze(clone));

				return newReferenceKey;
			}
		}
	}

	function referenceKeyOfObject(
		value: object,
		maxAge: number,
		depth: number
	): string {
		if (value === null) {
			return "null";
		} else {
			const constructorName = getConstructorName(value);

			if (
				constructorName === "Object" ||
				(Array.isArray(value) && constructorName === "Array")
			) {
				if (maxAge !== Infinity) {
					scheduledGarbageCollection();
				}

				return objectReferenceKey(value, maxAge, depth);
			} else {
				throw new Error(`Not implemented typeof value: '${constructorName}'`);
			}
		}
	}

	function referenceKeyOf(
		value: unknown,
		maxAge: number,
		depth: number
	): string {
		switch (typeof value) {
			case "string":
			case "number":
			case "bigint":
			case "boolean":
			case "undefined":
				return JSON.stringify(value);
			case "object":
				if (value === null) {
					return "null";
				} else {
					const constructorName = getConstructorName(value);

					if (
						constructorName === "Object" ||
						(Array.isArray(value) && constructorName === "Array")
					) {
						if (maxAge !== Infinity) {
							scheduledGarbageCollection();
						}

						return objectReferenceKey(value, maxAge, depth);
					} else {
						throw new Error(
							`Not implemented typeof value: '${constructorName}'`
						);
					}
				}
			case "symbol":
				throw new Error(
					`Not implemented Symbol.keyFor('${Symbol.keyFor(value)}')`
				);
			default:
				throw new Error(`Not implemented typeof value: '${typeof value}'`);
		}
	}

	function destruct() {
		object_referenceKey_Map = new WeakMap();
		objectSum_referenceKey_Map.clear();
		referenceKey_object_Map.clear();
		referenceKey_queue_Map.clear();
	}

	function haesh<const T extends Value | ReadonlyDeep<Value>>(
		value: T,
		maxAge: number = Infinity
	): ReadonlyDeep<T> {
		switch (typeof value) {
			case "string":
			case "number":
			case "bigint":
			case "boolean":
			case "undefined":
				return value as ReadonlyDeep<T>;
			case "object":
				if (value === null) {
					return value as ReadonlyDeep<T>;
				} else {
					const refKey = referenceKeyOfObject(value, maxAge, 0);
					const reference = referenceKey_object_Map.get(refKey);

					if (reference) {
						return reference as ReadonlyDeep<T>;
					} else {
						throw new Error("Reference is missing in memory");
					}
				}
			case "symbol":
				throw new Error(
					`Not implemented Symbol.keyFor('${Symbol.keyFor(value)}')`
				);
			default:
				throw new Error(`Not implemented typeof value: '${typeof value}'`);
		}
	}

	return [haesh, destruct] as const;
}

export type Primitive = string | number | boolean | null | undefined;

export type ObjectValue = { [Key in PropertyKey]: Value };

export type ArrayValue = Value[];

export type Value = Primitive | ObjectValue | ArrayValue;
