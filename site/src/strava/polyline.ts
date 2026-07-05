/**
 * Google Encoded Polyline algorithm decoder.
 * Strava's `map.summary_polyline` uses this format.
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 *
 * Returns [lat, lng] pairs in the same order Strava encoded them.
 */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dLat;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

/**
 * Project [lat, lng] points into a fixed SVG viewBox, preserving aspect
 * ratio. Equirectangular projection is fine at run-scale distances.
 *
 * Output is an SVG path `d` attribute string ("M x y L x y L x y ..."),
 * ready to drop into a <path d="..."> element. Coordinates fit inside
 * (inset, inset)..(width-inset, height-inset).
 */
export function projectToSvgPath(
  points: [number, number][],
  width = 360,
  height = 200,
  inset = 12,
): string {
  if (points.length === 0) return '';

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const [lat, lng] of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  // Correct longitude spread for latitude (equirectangular).
  const meanLat = (minLat + maxLat) / 2;
  const latSpan = maxLat - minLat || 1e-6;
  const lngSpan = (maxLng - minLng || 1e-6) * Math.cos((meanLat * Math.PI) / 180);

  const boxW = width - inset * 2;
  const boxH = height - inset * 2;
  // Fit-inside scale — keep aspect ratio, center on unused axis.
  const scale = Math.min(boxW / lngSpan, boxH / latSpan);
  const drawnW = lngSpan * scale;
  const drawnH = latSpan * scale;
  const offsetX = inset + (boxW - drawnW) / 2;
  const offsetY = inset + (boxH - drawnH) / 2;

  const parts: string[] = [];
  for (let i = 0; i < points.length; i++) {
    const [lat, lng] = points[i];
    // Correct lng span, then scale. Flip Y (SVG y grows downward).
    const x = offsetX + (lng - minLng) * Math.cos((meanLat * Math.PI) / 180) * scale;
    const y = offsetY + (maxLat - lat) * scale;
    parts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return parts.join(' ');
}
