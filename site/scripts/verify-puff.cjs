// Run against a production server: PUFF_URL=http://127.0.0.1:4190 node scripts/verify-puff.cjs
const { chromium } = require("playwright"),
	assert = require("assert"),
	fs = require("fs"),
	path = require("path");
const output =
	process.env.PUFF_EVIDENCE_DIR ||
	path.join(require("os").tmpdir(), "puff-verification");
fs.mkdirSync(output, { recursive: true });
(async () => {
	const b = await chromium.launch({
			executablePath:
				"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		}),
		results = [],
		errors = [];
	for (const viewport of [
		{ width: 1440, height: 900 },
		{ width: 390, height: 844 },
		{ width: 320, height: 568 },
		{ width: 844, height: 390 },
	]) {
		const p = await b.newPage({ viewport });
		p.on("pageerror", (e) => errors.push(e.message));
		await p.goto(process.env.PUFF_URL || "http://127.0.0.1:4190/");
		const f = await (await p.locator("iframe").elementHandle()).contentFrame();
		await f.locator(".explore-button").waitFor();
		await f.evaluate(() => document.fonts.ready);
		assert(
			await f
				.locator(".explore-button")
				.evaluate((e) => !e.matches(":focus-visible")),
		);
		assert.equal(await f.locator("[data-scene]").count(), 1);
		const title = await f
			.locator("h1")
			.evaluate((e) => ({
				font: getComputedStyle(e).fontSize,
				rect: e.getBoundingClientRect().toJSON(),
				star: document
					.querySelector("#light-button")
					.getBoundingClientRect()
					.toJSON(),
			}));
		assert.equal(title.font, "72px");
		assert(
			title.rect.x >= 0 && title.star.right <= viewport.width,
			JSON.stringify(title),
		);
		await f.evaluate(() => spaceScene.setMode("kite"));
		for (const [x, dir] of [
			[25, 1],
			[viewport.width - 25, -1],
		]) {
			await f
				.locator("#pixel-actor")
				.click({ position: { x, y: Math.round(viewport.height * 0.45) } });
			assert.equal(await f.evaluate(() => spaceScene.actor.direction), dir);
			await f.waitForTimeout(1600);
		}
		await p.screenshot({
			path: path.join(output, `release-intro-${viewport.width}.png`),
		});
		const start = Date.now();
		await f.locator(".explore-button").click();
		await p.locator("iframe").waitFor({ state: "detached" });
		const duration = Date.now() - start;
		assert(duration >= 2900 && duration < 5000);
		await p.waitForFunction(() => document.activeElement.id === "portfolio");
		assert(
			await p.evaluate(
				() => document.documentElement.scrollWidth === innerWidth,
			),
		);
		results.push({
			viewport,
			titleSize: title.font,
			kiteTransitionMs: duration,
			windSides: "passed",
		});
		await p.close();
	}
	await b.close();
	assert.deepEqual(errors, []);
	fs.writeFileSync(
		path.join(output, "puff-release-verification.json"),
		JSON.stringify({ results, errors }, null, 2),
	);
	console.log(results);
})();
