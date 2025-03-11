<script>
	import '../app.css';
	import { i18n } from '$lib/i18n';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	let { children } = $props();
</script>


<ParaglideJS {i18n}>
  <div class="dark bg-blue-900">
	  {@render children()}
  </div>
</ParaglideJS>
