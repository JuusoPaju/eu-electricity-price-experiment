<script>
  export let data;
  let jsonData = data.error 
    ? `Error: ${data.error}` 
    : JSON.stringify(data.price);
  </script>
  
  <h1>Welcome to SPOTTI</h1>
  <p>Price data: {jsonData}</p>