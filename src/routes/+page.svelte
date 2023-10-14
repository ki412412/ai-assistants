<script>
	import '../app.css';
	import { Button, Tabs, TabItem } from 'flowbite-svelte';
    import EnglishTutor from "$lib/components/pages/EnglishTutor.svelte";
    import GitCommitGenerator from "$lib/components/pages/GitCommitGenerator.svelte";
    import { page } from '$app/stores';
	import { goto } from '$app/navigation';

    // get anchor from url
    let anchor = $page.url.href.split('#')[1];
    // empty the anchor if it is not 'english-tutor' or 'git-commit-generator'
    if (anchor !== 'english-tutor' && anchor !== 'git-commit-generator') {
        anchor = '';
    }

    async function logout() {
		await fetch('api/auth/logout', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
		});
        goto('/login');
	}
</script>

<Tabs class="flex justify-between">

    <!-- TItle -->
    <div class="text-base md:text-2xl text-center md:text-left w-full md:w-fit">
        AI Assistants
    </div>

    <!-- Tabs -->
    <div class="flex w-full md:w-fit justify-center mt-3 md:mt-0">
        <a href="#english-tutor">
            <TabItem open={!anchor || anchor === 'english-tutor'} title="🤖 English Tutor">
                <EnglishTutor />
            </TabItem>
        </a>
        <a href="#git-commit-generator">
            <TabItem open={anchor === 'git-commit-generator'} title="🤖 Git Commit Generator">
                <GitCommitGenerator />
            </TabItem>
        </a>
    </div>

    <!-- Logout -->
    <div class="text-base md:text-2xl text-center md:text-left w-full md:w-fit">
        <Button color="alternative" on:click={logout}>Logout</Button>
    </div>
</Tabs>