"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

// ── Conversion data ──────────────────────────────────────────────────────────
const CATEGORIES: Record<string, { units: { label: string; factor: number }[] }> = {
  Length: {
    units: [
      { label: 'Meters (m)', factor: 1 },
      { label: 'Kilometers (km)', factor: 1000 },
      { label: 'Centimeters (cm)', factor: 0.01 },
      { label: 'Millimeters (mm)', factor: 0.001 },
      { label: 'Miles (mi)', factor: 1609.344 },
      { label: 'Yards (yd)', factor: 0.9144 },
      { label: 'Feet (ft)', factor: 0.3048 },
      { label: 'Inches (in)', factor: 0.0254 },
      { label: 'Nautical Miles (nmi)', factor: 1852 },
    ],
  },
  Weight: {
    units: [
      { label: 'Kilograms (kg)', factor: 1 },
      { label: 'Grams (g)', factor: 0.001 },
      { label: 'Milligrams (mg)', factor: 0.000001 },
      { label: 'Metric Tons (t)', factor: 1000 },
      { label: 'Pounds (lb)', factor: 0.453592 },
      { label: 'Ounces (oz)', factor: 0.0283495 },
      { label: 'Stones (st)', factor: 6.35029 },
    ],
  },
  Temperature: {
    units: [
      { label: 'Celsius (°C)', factor: NaN },
      { label: 'Fahrenheit (°F)', factor: NaN },
      { label: 'Kelvin (K)', factor: NaN },
    ],
  },
  Area: {
    units: [
      { label: 'Square Meters (m²)', factor: 1 },
      { label: 'Square Kilometers (km²)', factor: 1e6 },
      { label: 'Hectares (ha)', factor: 10000 },
      { label: 'Acres (ac)', factor: 4046.86 },
      { label: 'Square Feet (ft²)', factor: 0.092903 },
      { label: 'Square Inches (in²)', factor: 0.00064516 },
      { label: 'Square Miles (mi²)', factor: 2.59e6 },
    ],
  },
  Volume: {
    units: [
      { label: 'Liters (L)', factor: 1 },
      { label: 'Milliliters (mL)', factor: 0.001 },
      { label: 'Cubic Meters (m³)', factor: 1000 },
      { label: 'Gallons (US)', factor: 3.78541 },
      { label: 'Quarts (US)', factor: 0.946353 },
      { label: 'Pints (US)', factor: 0.473176 },
      { label: 'Cups (US)', factor: 0.236588 },
      { label: 'Fluid Ounces (US)', factor: 0.0295735 },
    ],
  },
  Speed: {
    units: [
      { label: 'Meters/Second (m/s)', factor: 1 },
      { label: 'Kilometers/Hour (km/h)', factor: 0.277778 },
      { label: 'Miles/Hour (mph)', factor: 0.44704 },
      { label: 'Knots (kn)', factor: 0.514444 },
      { label: 'Feet/Second (ft/s)', factor: 0.3048 },
    ],
  },
  Time: {
    units: [
      { label: 'Seconds (s)', factor: 1 },
      { label: 'Milliseconds (ms)', factor: 0.001 },
      { label: 'Minutes (min)', factor: 60 },
      { label: 'Hours (h)', factor: 3600 },
      { label: 'Days (d)', factor: 86400 },
      { label: 'Weeks (wk)', factor: 604800 },
      { label: 'Months (avg)', factor: 2629800 },
      { label: 'Years (yr)', factor: 31557600 },
    ],
  },
  'Data Storage': {
    units: [
      { label: 'Bytes (B)', factor: 1 },
      { label: 'Kilobytes (KB)', factor: 1024 },
      { label: 'Megabytes (MB)', factor: 1048576 },
      { label: 'Gigabytes (GB)', factor: 1073741824 },
      { label: 'Terabytes (TB)', factor: 1099511627776 },
      { label: 'Bits (b)', factor: 0.125 },
    ],
  },
};

function convertTemperature(value: number, from: string, to: string): number {
  // Normalize to Celsius first
  let celsius = value;
  if (from.includes('Fahrenheit')) celsius = (value - 32) * 5 / 9;
  else if (from.includes('Kelvin')) celsius = value - 273.15;

  // Then convert from Celsius to target
  if (to.includes('Fahrenheit')) return celsius * 9 / 5 + 32;
  if (to.includes('Kelvin')) return celsius + 273.15;
  return celsius;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function UnitConverterPage() {
  const categoryNames = Object.keys(CATEGORIES);
  const [category, setCategory] = useState('Length');
  const [inputValue, setInputValue] = useState('1');
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);

  const units = CATEGORIES[category].units;
  const isTemp = category === 'Temperature';

  const result = useMemo(() => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) return '';
    if (isTemp) {
      return convertTemperature(val, units[fromIdx].label, units[toIdx].label).toPrecision(10).replace(/\.?0+$/, '');
    }
    const base = val * units[fromIdx].factor;
    const converted = base / units[toIdx].factor;
    return converted.toPrecision(10).replace(/\.?0+$/, '');
  }, [inputValue, fromIdx, toIdx, category, units, isTemp]);

  const fromUnit = units[fromIdx]?.label.match(/\(([^)]+)\)/)?.[1] || '';
  const toUnit = units[toIdx]?.label.match(/\(([^)]+)\)/)?.[1] || '';

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Link href="/" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <span>Unit Converter</span>
      </nav>

      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 800,
        textAlign: 'center',
        marginBottom: '2.5rem',
        color: 'var(--primary-color)',
        letterSpacing: '-0.02em'
      }}>
        Unit Converter
      </h1>

      {/* Converter Card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Category Selector */}
        <select
          value={category}
          onChange={e => {
            setCategory(e.target.value);
            setFromIdx(0);
            setToIdx(1);
            setInputValue('1');
          }}
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-glass)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-main)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
            marginBottom: '1.5rem',
            appearance: 'none',
          }}
        >
          {categoryNames.map(c => (
            <option key={c} value={c}>{c} Converter</option>
          ))}
        </select>

        {/* Conversion Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* FROM */}
          <div>
            <input
              type="number"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              style={{
                width: '100%',
                padding: '1.25rem 1rem',
                fontSize: '2rem',
                fontWeight: 700,
                border: '2px solid var(--primary-color)',
                borderRadius: '12px',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                outline: 'none',
                textAlign: 'center',
                marginBottom: '0.75rem',
              }}
            />
            <select
              value={fromIdx}
              onChange={e => setFromIdx(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {units.map((u, i) => (
                <option key={i} value={i}>{u.label}</option>
              ))}
            </select>
          </div>

          {/* TO */}
          <div>
            <div style={{
              width: '100%',
              padding: '1.25rem 1rem',
              fontSize: '2rem',
              fontWeight: 700,
              border: '1px solid var(--border-glass)',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-main)',
              textAlign: 'center',
              marginBottom: '0.75rem',
              minHeight: '4.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {result || '—'}
            </div>
            <select
              value={toIdx}
              onChange={e => setToIdx(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {units.map((u, i) => (
                <option key={i} value={i}>{u.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Formula Card */}
      {result && inputValue && (
        <div style={{
          marginTop: '2rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glass)',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {units[fromIdx]?.label.split('(')[0].trim()} to {units[toIdx]?.label.split('(')[0].trim()} Formula
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {inputValue} {fromUnit} = <strong style={{ color: 'var(--primary-color)' }}>{result} {toUnit}</strong>
          </p>
        </div>
      )}

      {/* Quick category links */}
      <div style={{
        marginTop: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        justifyContent: 'center',
      }}>
        {categoryNames.map(c => (
          <button
            key={c}
            onClick={() => { setCategory(c); setFromIdx(0); setToIdx(1); setInputValue('1'); }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              border: '1px solid',
              borderColor: category === c ? 'var(--primary-color)' : 'var(--border-glass)',
              background: category === c ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: category === c ? 'var(--primary-color)' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </main>
  );
}
