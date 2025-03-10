<script>
  export let data;
  
  $: jsonData = data.error 
    ? `Error: ${data.error}` 
    : JSON.stringify(data);
</script>
  
<h1>Welcome to SPOTTI</h1>
<p>{jsonData}</p>