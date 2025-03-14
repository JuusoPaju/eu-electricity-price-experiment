import express from 'express';
import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';

const MAX_CACHE_SIZE = 5; // Maximum number of cache entries
// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Modified cache configuration: 1 hour TTL instead of 24 hours
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
const cacheKeys = []; // Array to track cache keys in order of creation

// Parse ENTSO-E date format
function formatDateToENTSOEString(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}`;
}

// Function to add a key to cache with tracking
function addToCache(key, data) {
  // Add to cache
  cache.set(key, data);
  
  // Add key to tracking array
  cacheKeys.push(key);
  
  // If there are multiple entries, remove the oldest one
  if (cacheKeys.length > MAX_CACHE_SIZE) {
    const oldestKey = cacheKeys.shift(); // Remove and get the oldest key
    cache.del(oldestKey);
    console.log(`Deleted oldest cache entry: ${oldestKey}`);
  }
}

// Parse XML to structured JSON
function parseXmlToJson(xmlData) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    ignoreNamespace: true,
    parseTagValue: true,
    parseAttributeValue: true,
    trimValues: true
  });

  const parsed = parser.parse(xmlData);
  const result = [];

  const timeSeries = parsed.Publication_MarketDocument.TimeSeries;
  const timeSeriesArray = Array.isArray(timeSeries) ? timeSeries : [timeSeries];
  
  for (const series of timeSeriesArray) {
    const period = series.Period;
    const startTime = new Date(period.timeInterval.start);
    const points = Array.isArray(period.Point) ? period.Point : [period.Point];

    for (const point of points) {
      const position = parseInt(point.position, 10);
      const timestamp = new Date(startTime.getTime() + (position - 1) * 60 * 60 * 1000);
      
      result.push({
        timestamp: timestamp.toISOString(),
        price: parseFloat(point["price.amount"]),
        currency: series["currency_Unit.name"],
        unit: series["price_Measure_Unit.name"]
      });
    }
  }

  return result;
}

// Fetch data from ENTSO-E API
async function fetchPriceData(startDate, endDate, domain = '10YFI-1--------U') {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) throw new Error('API_KEY environment variable required');

  const url = `https://web-api.tp.entsoe.eu/api?securityToken=${API_KEY}`
    + `&documentType=A44&out_Domain=${domain}&in_Domain=${domain}`
    + `&periodStart=${formatDateToENTSOEString(startDate)}`
    + `&periodEnd=${formatDateToENTSOEString(endDate)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    
    const xmlData = await response.text();
    return parseXmlToJson(xmlData);
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// API endpoint for current prices
app.get('/api/prices/current', async (req, res) => {
  try {
    const cacheKey = 'current_prices';
    
    // Check if data is in cache
    let data = cache.get(cacheKey);
    
    if (!data) {
      // If not in cache, fetch from API
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      
      data = await fetchPriceData(startDate, endDate);
      
      // Store in cache with tracking
      addToCache(cacheKey, data);
    }
    
    res.json(data);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for custom date range
app.get('/api/prices/range', async (req, res) => {
  try {
    const { startDate, endDate, domain } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate parameters are required' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    // Create a cache key based on parameters
    const cacheKey = `prices_${startDate}_${endDate}_${domain || 'default'}`;
    
    // Check if data is in cache
    let data = cache.get(cacheKey);
    
    if (!data) {
      // If not in cache, fetch from API
      data = await fetchPriceData(start, end, domain);
      
      // Store in cache with tracking
      addToCache(cacheKey, data);
    }
    
    res.json(data);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set up a scheduled task to refresh the current prices cache every hour
setInterval(async () => {
  try {
    console.log('Refreshing current prices cache...');
    const cacheKey = 'current_prices';
    
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    
    const data = await fetchPriceData(startDate, endDate);
    
    // Update cache with new data
    addToCache(cacheKey, data);
    
    console.log('Cache refreshed successfully at', new Date().toISOString());
  } catch (error) {
    console.error('Cache refresh error:', error);
  }
}, 3600000); // 3600000 ms = 1 hour

// Start server
app.listen(port, () => {
  console.log(`Electricity price API server running on port ${port}`);
});