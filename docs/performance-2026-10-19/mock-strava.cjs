// Synthetic, deterministic upstream for local benchmarks only. No real credentials.
const original = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = String(input?.url ?? input);
  if (url.startsWith('https://www.strava.com/api/v3/athlete/activities')) {
    await new Promise(resolve => setTimeout(resolve, Number(process.env.PERF_STRAVA_DELAY || 0)));
    return Response.json([{ id: 900000, name: 'Synthetic benchmark run', distance: 10000,
      moving_time: 2400, type: 'Run', visibility: 'everyone',
      map: { summary_polyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@' } }]);
  }
  return original(input, init);
};
