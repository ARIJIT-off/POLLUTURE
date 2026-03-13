/**
 * timeline.js — 50-year narrative timeline story beats
 */

'use strict';

const Timeline = (() => {

  const LAND_NARRATIVES = {
    wetland: {
      beats: [
        (y, p) => `Year ${y}: The wetland is cleared for construction. Monsoon runoff now has nowhere to drain — seasonal flooding risk increases by ${Math.round(p.floors * 8)}%.`,
        (y, p) => `Year ${y}: Groundwater recharge has dropped sharply. The local water table falls, and ${Math.round(p.residents * 0.3)} residents report dry taps in summer.`,
        (y, p) => `Year ${y}: AQI regularly crosses unsafe thresholds. Children in the area report elevated respiratory illness rates. The concrete heat island adds ${(p.floors * 0.15).toFixed(1)}°C locally.`,
        (y, p) => `Year ${y}: Biodiversity loss is now permanent — ${Math.round(p.areaHa * 12)} migratory bird species no longer use this corridor. Urban runoff causes downstream eutrophication.`,
        (y, p) => `Year ${y}: The ecological debt compounds. Remediation now would cost multiples of the original development. ${p.residents} residents live in degraded urban heat island conditions year-round.`,
      ],
    },
    vegetation: {
      beats: [
        (y, p) => `Year ${y}: Canopy cover removed. Urban surface albedo drops — temperatures begin rising. ${Math.round(p.areaHa * 150)} tonnes of carbon sequestration capacity is lost forever.`,
        (y, p) => `Year ${y}: PM2.5 levels climb as natural air filtration disappears. Nearest AQI station registers ${Math.round(160 + p.floors * 8)} — in the 'Poor' category.`,
        (y, p) => `Year ${y}: Local rainfall patterns shift due to loss of evapotranspiration. Droughts become more frequent. ${Math.round(p.areaHa * 80)} mm/year less local moisture.`,
        (y, p) => `Year ${y}: Soil erosion accelerates without root systems. The riverine sediment load increases by ${Math.round(p.areaHa * 20)} tonnes/year.`,
        (y, p) => `Year ${y}: ${p.residents} families live in an urbanized heat trap. Cooling costs surge. The area's ecological credit is fully exhausted — nature cannot self-recover.`,
      ],
    },
    agricultural: {
      beats: [
        (y, p) => `Year ${y}: Farmland paved. Local food production of ~${Math.round(p.areaHa * 4)} tonnes/year ceases. The community's food resilience drops.`,
        (y, p) => `Year ${y}: Irrigation infrastructure abandoned. Subsurface drainage collapses, causing localized waterlogging during monsoons in surrounding areas.`,
        (y, p) => `Year ${y}: Chemical residues from prior agricultural use leach into groundwater under construction pressure. Borewell tests show elevated nitrates.`,
        (y, p) => `Year ${y}: The urban density of ${p.residents} residents demands ${Math.round(p.residents * 150 * 365)} litres/year from an already stressed aquifer.`,
        (y, p) => `Year ${y}: Food-water-energy nexus stressed. Soil is permanently changed. Restoration to productive farmland would require ${Math.round(p.years * 0.8)} years and ₹${(p.areaHa * 800000).toLocaleString('en-IN')}.`,
      ],
    },
    bare: {
      beats: [
        (y, p) => `Year ${y}: Construction begins on previously open land. Dust and construction debris degrade local AQI immediately.`,
        (y, p) => `Year ${y}: Impervious cover increases. Storm runoff velocity rises, increasing flash flood risk for downstream neighborhoods by ${Math.round(p.floors * 5)}%.`,
        (y, p) => `Year ${y}: ${p.residents} residents generate ~${Math.round(p.residents * 0.4)} tonnes of solid waste per day. Existing landfill capacity is strained.`,
        (y, p) => `Year ${y}: Urban density intensifies. Heat island effect adds ${(p.floors * 0.12 * Math.min(p.years, 25) / p.years).toFixed(1)}°C. Energy demand for cooling grows.`,
        (y, p) => `Year ${y}: Ecological debt is realized as increased municipal costs for water, waste, and healthcare. The cumulative cost of ignoring ecological limits: inescapable.`,
      ],
    },
  };

  /**
   * Generate 5 timeline beats for a zone
   * Returns array of { year, text, severity (0-4) }
   */
  function generate(params) {
    const { landType, years } = params;
    const narratives = LAND_NARRATIVES[landType] || LAND_NARRATIVES.bare;

    // Distribute 5 beats across the time horizon
    const yrs = [
      0,
      Math.round(years * 0.15),
      Math.round(years * 0.35),
      Math.round(years * 0.60),
      years,
    ];

    return yrs.map((y, i) => ({
      year: y,
      severity: i,
      text: narratives.beats[i](y, params),
    }));
  }

  return { generate };
})();
