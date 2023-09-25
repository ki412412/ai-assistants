<script>
	import '../app.css';
	import { Tabs, TabItem } from 'flowbite-svelte';
    import EnglishTutor from "$lib/components/pages/EnglishTutor.svelte";
    import GitCommitGenerator from "$lib/components/pages/GitCommitGenerator.svelte";
</script>

<Tabs class="flex justify-end">
    <TabItem open title="English Tutor">
        <EnglishTutor />
    </TabItem>
    <TabItem title="Git Commit Generator">
        <GitCommitGenerator />
    </TabItem>
</Tabs>