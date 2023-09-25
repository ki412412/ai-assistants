<script>
	import '../app.css';
	import { Tabs, TabItem } from 'flowbite-svelte';
    import EnglishTutor from "$lib/components/pages/EnglishTutor.svelte";
    import GitCommitGenerator from "$lib/components/pages/GitCommitGenerator.svelte";
    import { page } from '$app/stores';

    // get anchor from url
    let anchor = $page.url.href.split('#')[1];
    // empty the anchor if it is not 'english-tutor' or 'git-commit-generator'
    if (anchor !== 'english-tutor' && anchor !== 'git-commit-generator') {
        anchor = '';
    }
</script>

<Tabs class="flex justify-end">
    <a href="#english-tutor">
        <TabItem open={!anchor || anchor === 'english-tutor'} title="English Tutor">
            <EnglishTutor />
        </TabItem>
    </a>
    <a href="#git-commit-generator">
        <TabItem open={anchor === 'git-commit-generator'} title="Git Commit Generator">
            <GitCommitGenerator />
        </TabItem>
    </a>
</Tabs>