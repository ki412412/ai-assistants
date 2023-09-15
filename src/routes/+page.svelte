<script lang="ts">
	import { useCompletion } from 'ai/svelte';
	import { writable } from 'svelte/store';
    import { Button, Textarea, Label } from 'flowbite-svelte';
    import et from '$lib/assets/et.gif';

    const japanese = writable("");
    const english = writable("");

    // input: your text to translate
    // completion: the responded text from chatGPT
    let { input, handleSubmit, completion, stop } = useCompletion({
    	api: "/api/chat",
  	});

    $: $input = `{"japanese":"${$japanese}", "english":"${$english}"}`;
</script>

<svelte:head>
	<title>English Tutor</title>
</svelte:head>

<section class="flex justify-center">
	<h1 class="flex text-center">
        <div class="ml-10 self-end">
            <span class=" text-4xl font-extrabolda">E</span><span class="text-xs">nglish</span> <span class="text-4xl font-extrabolda">T</span><span class="text-xs">utor</span>
        </div>
        <img src="{et}" alt="Deal with E.T." class="w-20 ml-6">
    </h1>
</section>

<section class="mt-6 md:mt-12 w-full h-full">
	<div class="flex flex-col md:flex-row gap-12 md:gap-6 p-3 md:p-12 m-6 h-full">

        <!-- original -->
        <div class="flex-1 flex flex-col content-stretch gap-3 md:gap-6 self-stretch rounded">
            <div>
                <Label for="japanese" class="mb-2">日本語（原文）</Label>
                <Textarea id="japanese" class="bg-white" placeholder="今日もいい天気ですね。" bind:value={$japanese} rows="4"/>
            </div>
            <div>
                <Label for="english" class="mb-2">あなたの英語訳</Label>
                <Textarea id="english" class="bg-white" placeholder="It's a nice day today." bind:value={$english} rows="4"/>
            </div>
            <form class="relative flex" on:submit={handleSubmit}>
                <Button type="submit" color="blue" class="grow">添削</Button>
            </form>
        </div>

		<!-- result and comment -->
		<div class="flex-1 flex flex-col">
            <div>
                <Label for="result" class="mb-2">"先生"による英語訳とアドバイス</Label>
            </div>
            <div class="flex-1 flex flex-col">
                <Textarea readonly class="flex-1" id="result" value={$completion} />
            </div>
		</div>
	</div>
</section>
