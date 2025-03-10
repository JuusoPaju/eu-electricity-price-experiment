export async function load({ fetch }) {
  try {
    // Use SvelteKit's built-in fetch
    const response = await fetch('http://localhost:3000/api/prices/current');
    if (!response.ok) {
      // Return an error object instead of throwing
      return {
        error: `Failed to fetch: ${response.status} ${response.statusText}`
      };
    }
    const data = await response.json();
    return {
      price: data
    };
  } catch (error) {
    console.error('Fetch error:', error);
  }
}