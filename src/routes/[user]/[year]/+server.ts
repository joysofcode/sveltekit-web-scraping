import { json } from '@sveltejs/kit'
import { parseHTML } from 'linkedom'
import type { RouteParams } from './$types.js'

export async function GET({ params, setHeaders }) {
	setHeaders({
		'Acces-Control-Allow-Origin': '*',
		'Cache-Control': `public, s-maxage=${60 * 60 * 24 * 365}`,
	})

	const html = await getContributions(params)
	return json(parseContributions(html))
}

async function getContributions({ user, year }: RouteParams) {
	const api = `https://github.com/users/${user}/contributions?from=${year}-12-01&to=${year}-12-31`
	const response = await fetch(api)

	if (!response.ok) {
		throw new Error(`Failed to fetch: ${response.status}`)
	}

	return await response.text()
}

function parseContributions(html: string) {
	const { document } = parseHTML(html)

	const days = document.querySelectorAll<Element>('tool-tip')

	const contributions: any[][] = [
		[], // Sundays
		[], // Mondays
		[], // Tuesdays
		[], // Wednesdays
		[], // Thursdays
		[], // Fridays
		[], // Saturdays
	]

	for (const [_, day] of days.entries()) {
		const data = day.innerHTML.split(' ')

		const forDayRaw = day.getAttribute('for')
		if (!forDayRaw) continue

		const forDay = forDayRaw.replace('contribution-day-component-', '')
		const [weekday, week] = forDay.split('-').map(Number)

		if (data.length > 1) {
			const td = document.getElementById(forDayRaw)
			if (!td) continue

			const level = td.dataset.level || '0'
			const contribution = {
				count: data[0] === 'No' ? 0 : +data[0],
				month: data[3],
				day: +data[4].replace(/(st|nd|rd|th)/, ''),
				level: +level,
			}
			contributions[weekday][week] = contribution
		}
	}

	return contributions
}
