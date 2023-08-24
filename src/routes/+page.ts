export async function load({ fetch }) {
	const contributions = await (await fetch('mattcroat/2021')).json()
	return { contributions }
}
