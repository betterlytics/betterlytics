export function reassignCountries(byCountry, countryReassign) {
  const moved = [];
  for (const [featureId, toCode] of Object.entries(countryReassign)) {
    for (const [code, features] of byCountry) {
      const moving = features.filter((f) => f.properties.iso_3166_2 === featureId);
      if (moving.length === 0 || code === toCode) continue;
      byCountry.set(code, features.filter((f) => !moving.includes(f)));
      if (!byCountry.has(toCode)) byCountry.set(toCode, []);
      byCountry.get(toCode).push(...moving);
      moved.push(`${featureId}: ${code} -> ${toCode}`);
    }
  }
  return moved;
}
