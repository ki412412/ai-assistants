<script lang="ts">
	import { useCompletion } from 'ai/svelte';

    // input: your text to translate
    // completion: the responded text from chatGPT
    let { input, handleSubmit, completion, stop } = useCompletion({
    	api: "/api/chat",
  	});
</script>

<section class="text-center">
	<h1 class="text-3xl">English tutor</h1>
</section>

<section class="mt-12 w-full h-full">
	<div class="flex gap-6 border rounded p-12 m-6 h-5/6">

        <!-- original -->
        <div class="self-stretch rounded overflow-hidden shadow-lg bg-white border w-full">
            <textarea class="w-full h-full" name="message" bind:value={$input}/>
        </div>

        <!-- translate button -->
        <div class="self-center place-self-center">
            <form class="w-full relative" on:submit={handleSubmit}>
                <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Translate
                </button>
            </form>
        </div>

		<!-- result and comment -->
		<div class="self-stretch rounded overflow-hidden shadow-lg bg-white border w-full">
            <textarea class="w-full h-full" value={$completion}/>
		</div>
	</div>
</section>
