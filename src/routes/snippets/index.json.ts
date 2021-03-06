/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { slugFromPath } from '$utils/slug-from-path';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ query }) {
	const modules = import.meta.glob('./**/index.{md,svx,svelte.md}');

	const snipptePromises = [];
	const limit = Number(query.get('limit') ?? Infinity);
	const recent = Number(query.get('recent') ?? Infinity);

	if (Number.isNaN(limit)) {
		return {
			status: 400,
		};
	}

	if (Number.isNaN(recent)) {
		return {
			status: 400,
		};
	}

	for (const [path, resolver] of Object.entries(modules)) {
		const slug = slugFromPath(path);
		const promise = resolver().then((snippet) => {
			return { slug, ...snippet.metadata };
		});

		snipptePromises.push(promise);
	}

	const sliceParam = query.get('recent') ? recent : limit;

	const snippets = await Promise.all(snipptePromises);
	const publishedPosts = snippets.filter((snippet) => snippet.published).slice(0, sliceParam);

	publishedPosts.sort((a, b) => (new Date(a.date) > new Date(b.date) ? -1 : 1));

	return {
		body: publishedPosts.slice(0, sliceParam),
	};
}
