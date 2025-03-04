import { expect, test } from "bun:test";
import { createHaesh } from "../src";

test("primitives", () => {
	const [æ, destroy] = createHaesh();

	// @ts-ignore: Argument of type 'number' is not assignable
	expect(() => æ(1)).toThrow();
	// @ts-ignore: Argument of type 'string' is not assignable
	expect(() => æ("1")).toThrow();
	// @ts-ignore: Argument of type 'boolean' is not assignable
	expect(() => æ(true)).toThrow();
	// @ts-ignore: Argument of type 'boolean' is not assignable
	expect(() => æ(false)).toThrow();

	destroy();
});

test("simple", () => {
	const [æ, destroy] = createHaesh();

	// number:
	expect(æ([1])).toBe(æ([1]));
	expect(æ([1])).not.toBe(æ([2]));
	expect(æ({ a: 1 })).toBe(æ({ a: 1 }));
	expect(æ({ a: 1 })).not.toBe(æ({ a: 2 }));
	// string:
	expect(æ(["lorem ipsum"])).toBe(æ(["lorem ipsum"]));
	expect(æ(["lorem ipsum"])).not.toBe(æ(["dolor sit amet"]));
	expect(æ({ s1: "lorem ipsum" })).toBe(æ({ s1: "lorem ipsum" }));
	expect(æ({ s2: "dolor sit amet" })).toBe(æ({ s2: "dolor sit amet" }));
	// booleans:
	expect(æ([true])).toBe(æ([true]));
	expect(æ([false])).toBe(æ([false]));
	expect(æ([false])).not.toBe(æ([true]));
	expect(æ([true])).not.toBe(æ([false]));
	expect(æ({ b1: true })).toBe(æ({ b1: true }));
	expect(æ({ b2: false })).toBe(æ({ b2: false }));
	expect(æ({ b3: false })).not.toBe(æ({ b3: true }));
	// null:
	expect(æ([null])).toBe(æ([null]));
	expect(æ({ n1: null })).toBe(æ({ n1: null }));
	expect(æ([null])).not.toBe(æ([undefined]));
	// undefined:
	expect(æ([undefined])).toBe(æ([undefined]));
	expect(æ([undefined])).not.toBe(æ([null]));
	expect(æ({ u1: undefined })).toBe(æ({ u1: undefined }));
	expect(æ({ u2: undefined })).not.toBe(æ({ u2: null }));

	// functions:;
	expect(æ([() => {}])).toBe(æ([() => {}]));
	expect(æ([() => {}])).not.toBe(æ([() => ""]));
	expect(æ({ f1: () => {} })).toBe(æ({ f1: () => {} }));
	expect(æ({ f2: () => "lorem ipsum" })).toBe(æ({ f2: () => "lorem ipsum" }));
	expect(æ({ f3: () => "lorem ipsum" })).not.toBe(
		æ({ f3: () => "dolor sit amet" })
	);

	expect(æ([1, 2, 3])).toBe(æ([1, 2, 3]));
	expect(æ([1, 2, 3])).toBe(æ([3, 2, 1]));
	expect(æ([1, 2, 3])).not.toBe(æ([1, 2, 4]));

	expect(æ([1, "2", true, null, undefined, æ([1, 2, 3])])).toBe(
		æ([æ([1, 2, 3]), null, 1, "2", true, undefined])
	);
	expect(æ({ a: 1, b: 2 })).toBe(æ({ b: 2, a: 1 }));
	expect(æ({ a: 1, b: 2 })).not.toBe(æ({ a: 1, b: 3 }));
	expect(æ({ a: 1, b: 2 })).not.toBe(æ({ a: 1 }));
	expect(æ({ a: 1 })).not.toBe(æ({ a: 1, b: 2 }));
	expect(æ({ a: 1, b: 2 })).not.toBe(æ({ a: 1, b: 2, c: 3 }));

	destroy();
});

test("mixed types", () => {
	const [æ, destroy] = createHaesh();

	expect(æ([1, "2", true, null, undefined, æ([1, 2, 3])])).toBe(
		æ([æ([1, 2, 3]), null, 1, "2", true, undefined])
	);

	expect(æ({ a: "1", b: 2 })).toBe(æ({ b: 2, a: "1" }));
	expect(æ({ a: "1", b: 2 })).not.toBe(æ({ a: 1, b: 2 }));

	expect(æ({ a: "1", b: 2 })).not.toBe(æ({ a: "1", b: 3 }));
	expect(æ({ a: "1", b: 2 })).not.toBe(æ({ a: "1" }));

	destroy();
});

test("deeply nested objects with arrays", () => {
	const [æ, destroy] = createHaesh();

	expect(æ({ a: æ({ b: æ([1, 2, 3]) }) })).toBe(
		æ({ a: æ({ b: æ([1, 2, 3]) }) })
	);
	expect(æ({ a: æ({ b: æ([1, 2, 3]) }) })).not.toBe(
		æ({ a: æ({ b: æ([1, 2, 4]) }) })
	);
	expect(æ({ a: æ({ b: æ([1, 2, 3]) }) })).not.toBe(
		æ({ a: æ({ b: æ([1, 2, 3, 4]) }) })
	);
	expect(æ({ a: æ({ b: æ([1, 2, 3, 4]) }) })).toBe(
		æ({ a: æ({ b: æ([1, 2, 3, 4]) }) })
	);
	expect(æ({ a: æ({ b: æ([1, 2, 3, 4]) }) })).not.toBe(
		æ({ a: æ({ b: æ([1, 2, 3, 5]) }) })
	);

	destroy();
});

test("deeply nested objects and arrays", () => {
	const [æ, destroy] = createHaesh();

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

	expect(() =>
		æ({ a: { b: [1, 2, { c: { d: "3", e: true, f: [1.1, null, false] } }] } })
	).toThrow();

	destroy();
});

test("frozen", () => {
	const [æ, destroy] = createHaesh();

	expect(æ({ a: 1 })).toBe(æ({ a: 1 }));
	expect(Object.isFrozen(æ({ a: 1 }))).toBe(true);

	destroy();
});
