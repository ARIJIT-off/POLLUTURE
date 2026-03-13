/**
 * calculator.js — Ecological impact formulas for Polluture
 * All calculations are deterministic models (no external APIs)
 */

'use strict';

const Calculator = (() => {

  // ── Land type impact multipliers ──
  const LAND_FACTORS = {
    wetland:      { aqi: 1.8, gw: 2.5, temp: 1.6, debtBase: 42000 },
    vegetation:   { aqi: 1.4, gw: 1.8, temp: 1.3, debtBase: 28000 },
    agricultural: { aqi: 1.2, gw: 1.5, temp: 1.1, debtBase: 18000 },
    bare:         { aqi: 0.8, gw: 0.9, temp: 0.7, debtBase: 10000 },
  };

  // AQI checkpoints: Y0, Y2, Y5, Y10, Y25, Yn
  const AQI_CHECKPOINTS = [0, 2, 5, 10, 25];

  /**
   * Calculate AQI over time
   * Base Kolkata AQI ~160 (poor). Construction adds 40. Each year cumulative.
   */
  function calcAQI(params) {
    const { landType, floors, residents, years } = params;
    const f = LAND_FACTORS[landType] || LAND_FACTORS.bare;
    const baseAQI = 160;
    const constructionSpike = floors * 4.5 * f.aqi;
    const residentialLoad = (residents / 50) * 3 * f.aqi;
    const annualIncrease = (constructionSpike * 0.03 + residentialLoad * 0.5) * f.aqi;

    const checkpoints = [...AQI_CHECKPOINTS, years].filter(y => y <= years);
    const unique = [...new Set(checkpoints)].sort((a, b) => a - b);

    return unique.map(y => ({
      year: y,
      aqi: Math.round(baseAQI + constructionSpike * Math.min(y / 2, 1) + annualIncrease * y),
    }));
  }

  /**
   * Groundwater drop in metres + total litres consumed
   */
  function calcGroundwater(params) {
    const { landType, floors, residents, years, areaHa } = params;
    const f = LAND_FACTORS[landType] || LAND_FACTORS.bare;
    const dailyLitresPerResident = 150;
    const imperviousnessFactor = 1 + floors * 0.04; // more concrete = more runoff lost
    const annualLitres = residents * dailyLitresPerResident * 365 * imperviousnessFactor * f.gw;
    const annualDropM = (annualLitres / (areaHa * 10000 * 1000)) * f.gw * 0.8;

    const checkpoints = [...AQI_CHECKPOINTS, years].filter(y => y <= years);
    const unique = [...new Set(checkpoints)].sort((a, b) => a - b);

    const totalLitres = annualLitres * years;
    const totalDropM = annualDropM * years;

    return {
      checkpoints: unique.map(y => ({
        year: y,
        dropM: parseFloat((annualDropM * y).toFixed(3)),
        litres: Math.round(annualLitres * y),
      })),
      totalDropM: parseFloat(totalDropM.toFixed(2)),
      totalLitres: Math.round(totalLitres),
    };
  }

  /**
   * Local temperature (Urban Heat Island) rise in °C
   */
  function calcTemperature(params) {
    const { landType, floors, residents, years } = params;
    const f = LAND_FACTORS[landType] || LAND_FACTORS.bare;
    const concreteHeat = floors * 0.05 * f.temp;
    const densityHeat  = (residents / 100) * 0.08 * f.temp;
    const annualRise   = (concreteHeat + densityHeat) * 0.6;

    const checkpoints = [...AQI_CHECKPOINTS, years].filter(y => y <= years);
    const unique = [...new Set(checkpoints)].sort((a, b) => a - b);

    const totalRise = annualRise * years;

    return {
      checkpoints: unique.map(y => ({
        year: y,
        tempRise: parseFloat((annualRise * y).toFixed(2)),
      })),
      totalRise: parseFloat(totalRise.toFixed(2)),
    };
  }

  /**
   * Ecological Debt in ₹
   * Based on land area, type, floors, residents, years
   */
  function calcEcologicalDebt(params) {
    const { landType, floors, residents, years, areaHa } = params;
    const f = LAND_FACTORS[landType] || LAND_FACTORS.bare;
    const baseDebt = areaHa * f.debtBase;
    const buildingDebt = floors * residents * 350 * f.aqi;
    const timeDebt = Math.pow(years, 1.15) * 1200;
    return Math.round(baseDebt + buildingDebt + timeDebt);
  }

  /**
   * Master compute function — returns full result object
   */
  function compute(params) {
    const aqi   = calcAQI(params);
    const gw    = calcGroundwater(params);
    const temp  = calcTemperature(params);
    const debt  = calcEcologicalDebt(params);

    // Summary values (final year)
    const finalAQI  = aqi[aqi.length - 1]?.aqi || 0;
    const finalDrop = gw.totalDropM;
    const finalTemp = temp.totalRise;

    return {
      aqi,
      groundwater: gw,
      temperature: temp,
      ecologicalDebt: debt,
      summary: {
        finalAQI,
        finalGroundwaterDrop: finalDrop,
        totalLitres: gw.totalLitres,
        finalTempRise: finalTemp,
      },
    };
  }

  // Public API
  return { compute, LAND_FACTORS };
})();
