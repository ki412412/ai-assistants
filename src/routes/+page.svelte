<script lang="ts">
	import { useCompletion } from 'ai/svelte';
	import { writable } from 'svelte/store';

    const japanese = writable("");
    const english = writable("");

    // input: your text to translate
    // completion: the responded text from chatGPT
    let { input, handleSubmit, completion, stop } = useCompletion({
    	api: "/api/chat",
  	});

    $: $input = `{"japanese":"${$japanese}", "english":"${$english}"}`;
</script>

<section class="text-center">
	<h1 class="text-3xl">English tutor</h1>
</section>

<section class="mt-12 w-full h-full">
	<div class="flex gap-6 border rounded p-12 m-6 h-5/6">

        <!-- original -->
        <div class="flex flex-col content-stretch gap-6 self-stretch rounded w-full h-1/2">
            <textarea class="w-full rounded shadow-lg p-3" bind:value={$japanese} placeholder="日本語（原文）"/>
            <textarea class="w-full rounded shadow-lg p-3" bind:value={$english} placeholder="あなたの英語訳"/>
            <form class="w-full relative flex" on:submit={handleSubmit}>
                <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full self-end">
                   添削
                </button>
            </form>
        </div>

        <!-- translate button -->
        <!-- <div class=" self-start place-self-center">
            
        </div> -->

		<!-- result and comment -->
		<div class="self-stretch rounded shadow-lg bg-white border w-full">
            <textarea readonly class="w-full h-full p-3" value={$completion} placeholder="ChatGPT先生による英語訳とアドバイス"/>
		</div>
	</div>
</section>
