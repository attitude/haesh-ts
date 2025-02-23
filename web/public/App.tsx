import { CSSProperties, memo, useEffect, useState } from "react";
import "./index.css";
import { createHaesh } from "@/index";

const [æ, æDestruct] = createHaesh();

const styles: Record<string, CSSProperties> = {
	noMargins: { margin: 0 },
	stack: { display: "flex", flexDirection: "column" },
	gap: { gap: 8 },
	codeBlock: {
		fontFamily: "monospace",
		fontSize: "0.75em",
		border: "1px dashed currentColor",
		borderRadius: 4,
		padding: 8,
		overflow: "auto",
	},
};

export function App() {
	const [time, setTime] = useState<number>(Date.now());

	useEffect(() => {
		const interval = setInterval(() => {
			setTime(Date.now());
		}, 100);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => () => æDestruct(), []);

	return (
		<Screen style={æ({ ...styles.stack, ...styles.gap })}>
			{/* <button onClick={() => æ.setMaxAge(1000)}>Clear older than 1s</button> */}
			<h1 style={styles.noMargins}>hæsh</h1>
			<p style={styles.noMargins}>
				This app re-renders every 100 milliseconds to demonstrate the difference
				between unstable and stable object references.
			</p>

			<Clock
				title="Unstable Clock"
				description="This clock uses unstable object references re-created on every render."
				time={{
					hour: new Date(time).getHours(),
					minute: new Date(time).getMinutes(),
					second: new Date(time).getSeconds(),
				}}
			/>

			<pre style={styles.codeBlock}>{`<Clock
  title="Unstable Clock"
  description="This clock uses unstable object references re-created on every render."
  time={{
    hour: new Date(time).getHours(),
    minute: new Date(time).getMinutes(),
    second: new Date(time).getSeconds(),
  }}
/>
`}</pre>

			<Clock
				title="Stable Clock"
				description="This clock uses stable object references thanks to the `æ` function."
				time={æ(
					{
						hour: new Date(time).getHours(),
						minute: new Date(time).getMinutes(),
						second: new Date(time).getSeconds(),
					},
					1000
				)}
			/>

			<pre style={styles.codeBlock}>{`<Clock
  title="Stable Clock"
  description="This clock uses stable object references thanks to the \`æ\` function."
  time={æ(
    {
      hour: new Date(time).getHours(),
      minute: new Date(time).getMinutes(),
      second: new Date(time).getSeconds(),
    },
    1000
  )}
/>
`}</pre>

			<hr />

			<h2 style={styles.noMargins}>
				Why <code>æ</code>?
			</h2>

			<p style={styles.noMargins}>
				It is the closest character that resembles a{" "}
				<code>HASH CHARACTER: #</code>. It could remind you of{" "}
				<a href="https://github.com/tc39/proposal-record-tuple">
					Record/Tuple Proposal
				</a>
				.
			</p>

			<hr />

			<div>
				<a
					href="https://github.com/attitude/haesh-ts"
					target="_blank"
				>
					Github
				</a>{" "}
				•{" "}
				<a
					href="https://www.npmjs.com/package/haesh"
					target="_blank"
				>
					NPM
				</a>
			</div>
		</Screen>
	);
}

interface ClockProps {
	title: string;
	description: string;
	time: {
		hour: number;
		minute: number;
		second: number;
	};
}

interface ScreenProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

const Screen = memo(function Screen({ children, ...rest }: ScreenProps) {
	return (
		<div
			{...rest}
			style={æ({ ...rest.style, ...styles.gap })}
		>
			{children}
		</div>
	);
});

const Clock = memo(function Clock({ description, title, time }: ClockProps) {
	const hour = time.hour.toString().padStart(2, "0");
	const minute = time.minute.toString().padStart(2, "0");
	const second = time.second.toString().padStart(2, "0");

	return (
		<div style={styles.stack}>
			<h2 style={styles.noMargins}>{title}</h2>
			<p style={styles.noMargins}>{description}</p>
			<div>
				{hour}:{minute}:{second}
			</div>
		</div>
	);
});

export default App;
