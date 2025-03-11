<!-- Description: Page component for displaying electricity spot prices -->
<script>
  import * as Table from "$lib/components/ui/table";
  export let data;

  // Format timestamp to readable time
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fi-FI', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  
  // Convert MWh to kWh and EUR to cents
  function convertPrice(pricePerMwh) {
    // 1 MWh = 1000 kWh, so price per kWh is price per MWh divided by 1000
    const pricePerKwh = pricePerMwh / 1000;
    // Convert EUR to cents (1 EUR = 100 cents)
    const priceInCents = pricePerKwh * 100;
    // Format to 2 decimal places
    return priceInCents.toFixed(2);
  }
  
  $: jsonData = data.error 
    ? `Error: ${data.error}` 
    : JSON.stringify(data);
</script>

<div class="flex justify-center">
  <div class="w-full max-w-3xl">
    <h1 class="text-2xl font-bold mb-4">Electricity Spot Prices, next 24 hours</h1>
    <Table.Root>
      <Table.Caption>Electricity spot price next 24 hours</Table.Caption>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-[100px]">Time</Table.Head>
          <Table.Head>Price</Table.Head>
          <Table.Head>Currency</Table.Head>
          <Table.Head class="text-right">Unit</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each data.data as item, i (i)}
          <Table.Row>
            <Table.Cell class="font-medium">{formatTime(item.timestamp)}</Table.Cell>
            <Table.Cell>{convertPrice(item.price)} c/kWh</Table.Cell>
            <Table.Cell>{item.currency}</Table.Cell>
            <Table.Cell class="text-right">kWh</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
    <p class="mt-4 text-sm text-gray-500">{jsonData}</p>
  </div>
</div>
<!-- <p>{jsonData}</p> -->