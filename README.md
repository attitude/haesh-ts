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
> **Average slowdown**: I tested with Bun and creating and matching references is around 6-7x slower than JUST creating the object. Yet still, we are still talking microseconds. The stability can save on re-renders of your app way more than that. Do your math and choose wisely.

## Usage

You can use haesh global context in your app:

```ts
import { createHaesh } from "haesh";
import { useEffect } from "react";

// Create a instance reusable thorough the app:
export const [æ, æDestruct] = createHaesh();

export function App(props) {
	// In case the App unmounts, free memory:
	useEffect(() => () => destroy(), []);

	return (
		<Theme.Provider value={æ({ color: "red" })}>/* your app */</Theme.Provider>
	);
}
```

Or in the create as many local contexts as you like:

```typescript
import { createHaesh } from "haesh";
import { useEffect } from "react";

export function View(props) {
	// Create a local instance:
	const [æ, destroy] = useMemo(() => createHaesh(), []);

	// Free the memory after component umount:
	useEffect(() => () => destroy, []);

	return (
		<div
			style={æ({ color: "red" }, 5_000)}
			{...props}
		/>
	);
}
```

---

## A React Hook

```ts
import { createHaesh } from "haesh";
import { useEffect, useMemo } from "react";

export function useHaesh() {
	const [haesh, destruct] = useMemo(() => createHaesh(), []);

	// Free the memory after component umount:
	useEffect(() => () => destruct(), [destruct]);

	return haesh;
}
```
