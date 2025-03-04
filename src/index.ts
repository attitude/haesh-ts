import type { ReadonlyDeep } from "type-fest";

// Cache commonly used values
const EMPTY_STRING = "";
const NULL_HASH = "n";
const TRUE_HASH = "t";
const FALSE_HASH = "f";
const DEFAULT_TIMEOUT = 1000;

export interface CreateOptions {
	ref?: (value: State) => void;
	strict?: boolean;
}

export interface State {
	stringHash_Map: Map<string, string>;
	functionHash_Map: Map<string, string>;
	referenceKey_object_Map: Map<string, object>;
	referenceKey_queue_Map: Map<string, number>;
	object_referenceKey_Map: WeakMap<object, string>;
}

function hashOfNumber(value: number): string {
	return `n${value}`;
}

function hashOfBoolean(value: boolean): string {
	return value ? TRUE_HASH : FALSE_HASH;
}

function hashOfUndefined(): string {
	return EMPTY_STRING;
}

function hashOfNull(): string {
	return NULL_HASH;
}

function hashOfBigint(value: bigint): string {
	return `B${value}`;
}

const IDLE_CALLBACK_IS_SUPPORTED = typeof requestIdleCallback === "function";

export function createHaesh(options: CreateOptions = {}) {
	const ref = options.ref;
	const strict = options.strict ?? true;

	const state: State = {
		stringHash_Map: new Map(),
		functionHash_Map: new Map(),
		referenceKey_object_Map: new Map(),
		referenceKey_queue_Map: new Map(),
		object_referenceKey_Map: new WeakMap(),
	};

	if (ref) {
		ref(state);
	}

	function hashOfString(value: string): string {
		const hash = state.stringHash_Map.get(value);

		if (hash) {
			return hash;
		} else {
			const hash = `s${state.stringHash_Map.size}`;
			state.stringHash_Map.set(value, hash);

			return hash;
		}
	}

	function hashOfFunction(value: Function): string {
		const content = value.toString();
		const hash = state.functionHash_Map.get(content);

		if (hash) {
			return hash;
		} else {
			const hash = `"f${state.functionHash_Map.size}"`;
			state.functionHash_Map.set(content, hash);

			return hash;
		}
	}

	function setReferenceKeyMaxAge(referenceKey: string, maxAge: number): void {
		if (maxAge === Infinity) {
			state.referenceKey_queue_Map.delete(referenceKey);
		} else {
			state.referenceKey_queue_Map.set(referenceKey, Date.now() + maxAge);
		}
	}

	let gcTimeout: Timer | null = null;
	let gcIdleId: number | null = null;

	function collectGarbage(): void {
		const now = Date.now();
		const keysToDelete: string[] = [];

		for (const [referenceKey, diedAt] of state.referenceKey_queue_Map) {
			if (diedAt < now) {
				keysToDelete.push(referenceKey);
			}
		}

		for (const key of keysToDelete) {
			state.referenceKey_object_Map.delete(key);
			state.referenceKey_queue_Map.delete(key);
		}

		if (gcIdleId) {
			cancelIdleCallback(gcIdleId);
			gcIdleId = null;
		}

		if (gcTimeout) {
			clearTimeout(gcTimeout);
			gcTimeout = null;
		}
	}

	function scheduleNextGC(): void {
		if (IDLE_CALLBACK_IS_SUPPORTED) {
			if (!gcIdleId) {
				gcIdleId = requestIdleCallback(collectGarbage, {
					timeout: DEFAULT_TIMEOUT,
				});
			}
		} else {
			if (!gcTimeout) {
				gcTimeout = setTimeout(collectGarbage, DEFAULT_TIMEOUT);
			}
		}
	}

	function getValueType(value: any): string {
		if (value === null) return "null";
		if (value === undefined) return "undefined";
		return typeof value;
	}

	function haesh<
		T extends
			| null
			| undefined
			| ObjectValue
			| ArrayValue
			| ReadonlyDeep<ObjectValue>
			| ReadonlyDeep<ArrayValue>
	>(value: T, maxAge: number = Infinity): ReadonlyDeep<T> {
		if (value == null) return value as ReadonlyDeep<T>;

		if (!value || typeof value !== "object") {
			throw new TypeError(
				`Value must be an object or an array, got ${getValueType(value)}`
			);
		}

		if (maxAge !== Infinity) {
			scheduleNextGC();
		}

		const cachedKey = state.object_referenceKey_Map.get(value);
		if (cachedKey) {
			setReferenceKeyMaxAge(cachedKey, maxAge);
			return value as ReadonlyDeep<T>;
		}

		if (Array.isArray(value)) {
			return hashArray(value, maxAge) as ReadonlyDeep<T>;
		} else {
			return hashObject(value as ObjectValue, maxAge) as ReadonlyDeep<T>;
		}
	}

	function hashArray<T extends ArrayValue>(
		value: T,
		maxAge: number
	): Readonly<T> {
		const length = value.length;
		const sum = new Array(length);
		const copy = new Array(length);

		for (let i = 0; i < length; i++) {
			const item = value[i];
			const type = getValueType(item);

			copy[i] = item;
			sum[i] = hashValue(item, type);
		}

		if (sum.length > 1) {
			sum.sort();
		}

		const key = `[${sum.join(",")}]`;
		return finalizeHash(key, copy, maxAge) as T;
	}

	function hashObject<T extends ObjectValue>(
		value: T,
		maxAge: number
	): Readonly<T> {
		const copy = {} as ObjectValue;
		const keys = Object.keys(value);
		const length = keys.length;

		if (length > 1) {
			keys.sort();
		}

		const sum = new Array(length);
		for (let i = 0; i < length; i++) {
			const key = keys[i];
			const item = value[key];
			const type = getValueType(item);

			copy[key] = item;
			sum[i] = `${key}:${hashValue(item, type)}`;
		}

		const key = `{${sum.join(",")}}`;
		return finalizeHash(key, copy, maxAge) as T;
	}

	function hashValue(item: any, type: string): string {
		switch (type) {
			case "string":
				return hashOfString(item);
			case "number":
				return hashOfNumber(item);
			case "boolean":
				return hashOfBoolean(item);
			case "undefined":
				return hashOfUndefined();
			case "bigint":
				return hashOfBigint(item);
			case "function":
				return hashOfFunction(item);
			case "object":
			case "null":
				if (item === null) return hashOfNull();
				return hashReference(item);
			default:
				throw new Error(`Not implemented typeof item: '${type}'`);
		}
	}

	function recover(value: ObjectValue | ArrayValue, maxAge: number = Infinity) {
		return haesh(value, maxAge);
	}

	// Handle object references
	function hashReference(item: object): string {
		const cachedKey = state.object_referenceKey_Map.get(item);

		if (!cachedKey && !strict) {
			const newItem = recover(item as ObjectValue | ArrayValue);
			const newCachedKey = state.object_referenceKey_Map.get(newItem);

			if (!newCachedKey) {
				throw new Error("Reference is missing in memory");
			}

			return newCachedKey;
		}

		if (!cachedKey) {
			throw new Error("Reference is missing in memory");
		}

		return cachedKey;
	}

	// Finalize hash creation and storage
	function finalizeHash<T>(key: string, value: T, maxAge: number): Readonly<T> {
		setReferenceKeyMaxAge(key, maxAge);

		const existing = state.referenceKey_object_Map.get(key) as T;
		if (existing) return existing;

		const frozen = Object.freeze(value);
		state.referenceKey_object_Map.set(key, frozen);
		state.object_referenceKey_Map.set(frozen, key);

		return frozen;
	}

	function destroy() {
		if (IDLE_CALLBACK_IS_SUPPORTED && gcIdleId) {
			cancelIdleCallback(gcIdleId);
		}

		if (gcTimeout) {
			clearTimeout(gcTimeout);
		}

		gcIdleId = null;
		gcTimeout = null;

		state.stringHash_Map.clear();
		state.functionHash_Map.clear();
		state.referenceKey_object_Map.clear();
		state.referenceKey_queue_Map.clear();
		state.object_referenceKey_Map = new WeakMap();
	}

	return [haesh, destroy] as const;
}

export type Primitive = Function | string | number | boolean | null | undefined;
export type ObjectValue = { [Key in PropertyKey]: Value };
export type ArrayValue = Array<Value>;
export type Value = Primitive | ObjectValue | ArrayValue;
