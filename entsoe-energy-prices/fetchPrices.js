import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';


const { API_KEY } = process.env;

function formatDateToENTSOEString(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}`;
}

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

  // Debug to see the actual structure
  // console.log(JSON.stringify(parsed, null, 2));

  const timeSeries = parsed.Publication_MarketDocument.TimeSeries;
  const timeSeriesArray = Array.isArray(timeSeries) ? timeSeries : [timeSeries];
  
  for (const series of timeSeriesArray) {
    const period = series.Period;
    const startTime = new Date(period.timeInterval.start);
    const points = Array.isArray(period.Point) ? period.Point : [period.Point];

    for (const point of points) {
      const position = parseInt(point.position, 10);
      const timestamp = new Date(startTime.getTime() + (position - 1) * 60 * 60 * 1000);
      
      // Access the correct property names as they appear in the parsed XML
      result.push({
        timestamp: timestamp.toISOString(),
        price: parseFloat(point["price.amount"]),
        currency: series["currency_Unit.name"],  // Using bracket notation for properties with dots
        unit: series["price_Measure_Unit.name"]
      });
    }
  }

  return result;
}

const fetchAndCacheData = async () => {
  if (!API_KEY) throw new Error('API_KEY environment variable required');

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

  const url = `https://web-api.tp.entsoe.eu/api?securityToken=${API_KEY}`
    + `&documentType=A44&out_Domain=10YFI-1--------U&in_Domain=10YFI-1--------U`
    + `&periodStart=${formatDateToENTSOEString(startDate)}`
    + `&periodEnd=${formatDateToENTSOEString(endDate)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    
    const xmlData = await response.text();
    const jsonData = parseXmlToJson(xmlData);
    
    return jsonData;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};


fetchAndCacheData()
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(console.error);