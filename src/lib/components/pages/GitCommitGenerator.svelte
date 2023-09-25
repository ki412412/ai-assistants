<script lang="ts">
	import { useCompletion } from 'ai/svelte';
	import { writable } from 'svelte/store';
    import { Button, Textarea, Label } from 'flowbite-svelte';
    import whowrotethiscode from '$lib/assets/whowrotethiscode.gif';

    const description = writable("");

    let { input, handleSubmit, completion, stop, isLoading } = useCompletion({
    	api: "/api/git-commit-generator",
  	});
</script>

<svelte:head>
	<title>English Tutor</title>
</svelte:head>

<section class="flex justify-center">
	<h1 class="flex text-center">
        <div class="ml-10 self-end">
            <span class=" text-4xl font-extrabolda">G</span><span class="text-xs">it</span>　<span class="text-4xl font-extrabolda">C</span><span class="text-xs">ommit</span> <span class="text-4xl font-extrabolda">G</span><span class="text-xs">nerator</span>
        </div>
        <img src="{whowrotethiscode}" alt="WHO WROTE THIS CODE?" class="w-20 ml-6">
    </h1>
</section>

<section class="mt-6 md:mt-12 w-full h-full">
	<div class=" gap-12 md:gap-6 p-3 md:p-12 m-6 h-full">

        <!-- original -->
        <div class="flex-1 flex flex-col content-stretch self-stretch rounded">
            <div>
                <Label for="japanese" class="mb-2">コミットの内容の説明</Label>
                <Textarea id="japanese" class="bg-white" placeholder="ログイン機能の不具合を修正。" bind:value={$input} rows="4"/>
            </div>
            <form class="relative flex" on:submit={handleSubmit}>
                {#if $isLoading}
                    <Button type="button" color="red" class="grow" on:click={stop}>ストップ</Button>
                {:else}
                    <Button type="submit" color="blue" class="grow">生成する</Button>
                {/if}
            </form>
        </div>

		<!-- result and comment -->
		<div class="mt-10 flex-1 flex flex-col">
            <div>
                <Label for="result" class="mb-2">コミットメッセージとアドバイス</Label>
            </div>
            <div class="flex-1 flex flex-col">
                <Textarea readonly class="flex-1" id="result" value={$completion} rows="30"/>
            </div>
		</div>
	</div>
</section>
