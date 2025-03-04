# haesh

> [!TIP]
> Use keys `[Option/Alt]` + `[']` to enter `æ` character on a Mac. It looks similar to `#` but can be used as a regular function name.

A tiny library for creating stable reference objects and arrays similar to Records
and Tuples but without custom classes similar to polyfills of Record/Tuple Proposal.

Haesh does use `WeakMap` to garbage collect memory automatically. However,
you can use `destroy` method to destroy and free up the occupied memory after use
or provide second `maxAge` argument to `æ`.

> [!IMPORTANT]
>
> **Average slowdown**: I tested with Bun and creating and matching references is around 5-6x slower than JUST creating the object. Yet still, we are still talking microseconds. The stability can save on re-renders of your app way more than that. Do your math and choose wisely.

## Usage

You can use haesh global context in your app:

```ts
import { createHaesh } from "haesh";
import { useEffect } from "react";

// Create a instance reusable thorough the app:
export const [æ, destroy] = createHaesh();

export function App(props) {
	// In case the App unmounts, free memory:
	useEffect(() => {
		return destroy;
	}, []);

	return (
		<Theme.Provider value={æ({ color: "red" })}>/* your app */</Theme.Provider>
	);
}
```

Or create as many local contexts as you like:

```typescript
import { createHaesh } from "haesh";
import { useEffect, useMemo } from "react";

export function View(props) {
	// Create a local instance:
	const [æ, destroy] = useMemo(() => createHaesh(), []);

	// Free the memory after component umount:
	useEffect(() => {
		return destroy;
	}, [destroy]);

	return (
		<div
			style={æ({ color: "red" }, 5_000)}
			{...props}
		/>
	);
}
```

## API

### `createHaesh(options?)`

Creates a new haesh instance.

```typescript
const [æ, destroy] = createHaesh({
	// Makes nested objects throw an error unless they are already hashed
	strict: true, // default: true
	// Time in ms between garbage collection runs
	garbageCollectionInterval: 1000, // default: 1000
	// Optional reference to the internal state
	ref: (state) => {
		/* ... */
	},
});
```

### `æ(value, maxAge?)`

Hashes a value and returns a frozen reference.

- `value`: An object or array to hash
- `maxAge`: Optional time in milliseconds after which the reference will be garbage collected (default: `Infinity`)

### `destroy()`

Destroys the haesh instance and frees up memory. This can be used directly as a cleanup function in React's useEffect.

---

## A React Hook

```ts
import { createHaesh } from "haesh";
import { useEffect, useMemo } from "react";

export function useHaesh() {
	const [haesh, destroy] = useMemo(() => createHaesh(), []);

	// Free the memory after component umount:
	useEffect(() => destroy, [destroy]);

	return haesh;
}
```
