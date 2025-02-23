import { expect, test } from "bun:test";
import { createHaesh } from "../src";

test("primitives", () => {
	const [æ] = createHaesh();

	expect(æ(1)).toBe(æ(1));
	expect(æ(1)).not.toBe(æ(2));
	expect(æ("a")).toBe(æ("a"));
	expect(æ("a")).not.toBe(æ("b"));
	expect(æ(true)).toBe(æ(true));
	expect(æ(true)).not.toBe(æ(false));
	expect(æ(null)).toBe(æ(null));
	expect(æ(null)).not.toBe(æ(undefined));
	expect(æ(undefined)).toBe(æ(undefined));
	expect(æ(undefined)).not.toBe(æ(null));
});

test("simple", () => {
	const [æ] = createHaesh();

	expect(æ({ a: 1 })).toBe(æ({ a: 1 }));
	expect(æ({ a: 1 })).not.toBe(æ({ a: 2 }));
	expect(æ([1, 2, 3])).toBe(æ([1, 2, 3]));
	expect(æ([1, 2, 3])).not.toBe(æ([1, 2, 4]));
});

test("nested", () => {
	const [æ] = createHaesh();

	expect(æ({ a: { b: 1 } })).toBe(æ({ a: { b: 1 } }));
	expect(æ({ a: { b: 1 } })).not.toBe(æ({ a: { b: 2 } }));
	expect(æ({ a: { b: 1 } })).not.toBe(æ({ a: { c: 1 } }));
	expect(æ({ a: { b: 1 } })).not.toBe(æ({ a: { b: 1, c: 2 } }));
	expect(æ({ a: { b: 1, c: 2 } })).toBe(æ({ a: { c: 2, b: 1 } }));
	expect(æ({ a: { b: 1, c: 2 } })).toBe(æ({ a: { c: 2, b: 1 } }));
	expect(æ({ a: { b: 1, c: 2 } })).not.toBe(æ({ a: { c: 2, b: 1, d: 3 } }));
	expect(æ({ a: { b: 1, c: 2, d: 3 } })).toBe(æ({ a: { c: 2, b: 1, d: 3 } }));
	expect(æ({ a: { b: 1, c: 2, d: 3 } })).toBe(æ({ a: { c: 2, b: 1, d: 3 } }));
	expect(æ({ a: { b: 1, c: 2, d: 3 } })).not.toBe(
		æ({ a: { c: 2, b: 1, d: 4 } })
	);
});

test("deeply nested objects with arrays", () => {
	const [æ] = createHaesh();

	expect(æ({ a: { b: [1, 2, 3] } })).toBe(æ({ a: { b: [1, 2, 3] } }));
	expect(æ({ a: { b: [1, 2, 3] } })).not.toBe(æ({ a: { b: [1, 2, 4] } }));
	expect(æ({ a: { b: [1, 2, 3] } })).not.toBe(æ({ a: { b: [1, 2, 3, 4] } }));
	expect(æ({ a: { b: [1, 2, 3, 4] } })).toBe(æ({ a: { b: [1, 2, 3, 4] } }));
	expect(æ({ a: { b: [1, 2, 3, 4] } })).not.toBe(æ({ a: { b: [1, 2, 3, 5] } }));
});

test("strict and deeply nested objects with arrays and objects", () => {
	const [æ] = createHaesh({ strict: true });

	expect(() => æ({ a: { b: [1, 2, 3] } })).toThrow();
	expect(() => æ([3, 2, 1])).not.toThrow();

	expect(() => æ({ b: æ([3, 2, 1]) })).not.toThrow();
	expect(() => æ({ a: æ({ b: æ([1, 2, 3]) }) })).not.toThrow();

	expect(() => æ({ a: { b: [1, 2, 3] } })).toThrow();
	expect(() => æ({ a: æ({ b: æ([1, 2, 4]) }) })).not.toThrow();

	expect(() => æ({ a: { b: [1, 2, 3] } })).toThrow();
	expect(() => æ({ a: æ({ b: æ([1, 2, 3, 4]) }) })).not.toThrow();

	expect(() => æ({ a: { b: [1, 2, 3, 4] } })).toThrow();
	expect(() => æ({ a: æ({ b: æ([1, 2, 3, 4]) }) })).not.toThrow();

	expect(() => æ({ a: { b: [1, 2, 3, 4] } })).toThrow();
	expect(() => æ({ a: æ({ b: æ([1, 2, 3, 5]) }) })).not.toThrow();
});

test("frozen", () => {
	const [æ] = createHaesh();

	expect(æ({ a: 1 })).toBe(æ({ a: 1 }));
	expect(Object.isFrozen(æ({ a: 1 }))).toBe(true);
});

test("symbol", () => {
	const [æ] = createHaesh();

	// @ts-expect-error: Argument of type 'symbol' is not assignable to parameter of type 'JsonValue'.ts(2345)
	expect(() => æ(Symbol("a"))).toThrow();
});
