// Source of data: https://github.com/epoberezkin/fast-deep-equal/blob/master/spec/tests.js

import { createHaesh } from "./src/index";

const rounds: Array<{
	description: string;
	tests: Array<{
		description: string;
		value1: unknown;
		value2: unknown;
		equal: boolean;
	}>;
}> = [
	{
		description: "objects",
		tests: [
			{
				description: "empty objects are equal",
				value1: {},
				value2: {},
				equal: true,
			},
			{
				description: 'equal objects (same properties "order")',
				value1: { a: 1, b: "2" },
				value2: { a: 1, b: "2" },
				equal: true,
			},
			{
				description: 'equal objects (different properties "order")',
				value1: { a: 1, b: "2" },
				value2: { b: "2", a: 1 },
				equal: true,
			},
			{
				description: "not equal objects (extra property)",
				value1: { a: 1, b: "2" },
				value2: { a: 1, b: "2", c: [] },
				equal: false,
			},
			{
				description: "not equal objects (different property values)",
				value1: { a: 1, b: "2", c: 3 },
				value2: { a: 1, b: "2", c: 4 },
				equal: false,
			},
			{
				description: "not equal objects (different properties)",
				value1: { a: 1, b: "2", c: 3 },
				value2: { a: 1, b: "2", d: 3 },
				equal: false,
			},
			{
				description: "equal objects (same sub-properties)",
				value1: { a: [{ b: "c" }] },
				value2: { a: [{ b: "c" }] },
				equal: true,
			},
			{
				description: "not equal objects (different sub-property value)",
				value1: { a: [{ b: "c" }] },
				value2: { a: [{ b: "d" }] },
				equal: false,
			},
			{
				description: "not equal objects (different sub-property)",
				value1: { a: [{ b: "c" }] },
				value2: { a: [{ c: "c" }] },
				equal: false,
			},
			{
				description: "empty array and empty object are not equal",
				value1: {},
				value2: [],
				equal: false,
			},
			{
				description: "object with extra undefined properties are not equal #1",
				value1: {},
				value2: { foo: undefined },
				equal: false,
			},
			{
				description: "object with extra undefined properties are not equal #2",
				value1: { foo: undefined },
				value2: {},
				equal: false,
			},
			{
				description: "object with extra undefined properties are not equal #3",
				value1: { foo: undefined },
				value2: { bar: undefined },
				equal: false,
			},
			{
				description: "nulls are equal",
				value1: null,
				value2: null,
				equal: true,
			},
			{
				description: "null and empty object are not equal",
				value1: null,
				value2: {},
				equal: false,
			},
		],
	},

	{
		description: "arrays",
		tests: [
			{
				description: "two empty arrays are equal",
				value1: [],
				value2: [],
				equal: true,
			},
			{
				description: "equal arrays",
				value1: [1, 2, 3],
				value2: [1, 2, 3],
				equal: true,
			},
			{
				description: "not equal arrays (different item)",
				value1: [1, 2, 3],
				value2: [1, 2, 4],
				equal: false,
			},
			{
				description: "not equal arrays (different length)",
				value1: [1, 2, 3],
				value2: [1, 2],
				equal: false,
			},
			{
				description: "equal arrays of objects",
				value1: [{ a: "a" }, { b: "b" }],
				value2: [{ a: "a" }, { b: "b" }],
				equal: true,
			},
			{
				description: "not equal arrays of objects",
				value1: [{ a: "a" }, { b: "b" }],
				value2: [{ a: "a" }, { b: "c" }],
				equal: false,
			},
			{
				description: "pseudo array and equivalent array are not equal",
				value1: { "0": 0, "1": 1, length: 2 },
				value2: [0, 1],
				equal: false,
			},
		],
	},
	{
		description: "sample objects",
		tests: [
			{
				description: "big object",
				value1: {
					prop1: "value1",
					prop2: "value2",
					prop3: "value3",
					prop4: {
						subProp1: "sub value1",
						subProp2: {
							subSubProp1: "sub sub value1",
							subSubProp2: [1, 2, { prop2: 1, prop: 2 }, 4, 5],
						},
					},
					prop5: 1000,
					prop6: [2016, 2, 10],
				},
				value2: {
					prop5: 1000,
					prop3: "value3",
					prop1: "value1",
					prop2: "value2",
					prop6: [2016, 2, 10],
					prop4: {
						subProp2: {
							subSubProp1: "sub sub value1",
							subSubProp2: [1, 2, { prop2: 1, prop: 2 }, 4, 5],
						},
						subProp1: "sub value1",
					},
				},
				equal: true,
			},
		],
	},
];
const [æ] = createHaesh({
	strict: false,
});

const REPEAT = 1_000_000;

let totalSlowdown = 0;
let testsCount = 0;

rounds.forEach(({ description, tests }) => {
	tests.forEach(({ description, value1, value2, equal }) => {
		console.log(`+ ${description}\n`);

		const jsonValue1 = JSON.stringify(value1);
		const jsonValue2 = JSON.stringify(value2);

		const start1 = performance.now();
		for (let i = 0; i < REPEAT; i++) {
			JSON.parse(jsonValue1);
			JSON.parse(jsonValue2);
		}
		const end1 = performance.now();
		const diff1 = end1 - start1;

		console.log(`Default: ${diff1}ms`);

		const start2 = performance.now();
		for (let i = 0; i < REPEAT; i++) {
			æ(JSON.parse(jsonValue1));
			æ(JSON.parse(jsonValue2));
		}
		const end2 = performance.now();
		const diff2 = end2 - start2;

		console.log(`Wrapped: ${diff2}ms`);

		const slowdown = Math.round((diff2 / diff1) * 10) / 10;

		console.log(`Slowdown: ${slowdown}x\n`);

		totalSlowdown += slowdown;
		testsCount++;
	});
});

console.log(
	`Average slowdown: ${Math.round((totalSlowdown / testsCount) * 10) / 10}x`
);
