import { Configuration, OpenAIApi } from 'openai-edge';
import { OpenAIStream, StreamingTextResponse } from 'ai';

import { OPENAI_API_KEY, OPENAI_MODEL } from '$env/static/private';

import type { RequestHandler } from './$types';

// Create an OpenAI API client
const config = new Configuration({
    apiKey: OPENAI_API_KEY
});
const openai = new OpenAIApi(config);

export const POST = (async ({ request }) => {
    // Extract the `prompt` from the body of the request
    const { prompt } = await request.json();
    const content = createContent(prompt);

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.createChatCompletion({
        model: OPENAI_MODEL,
        stream: true,
        // messages: messages.map((message: any) => ({
        //     content: message.content,
        //     role: message.role
        // }))
        messages: [ {role: "user", content: content}]
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);
    // Respond with the stream
    return new StreamingTextResponse(stream);
}) satisfies RequestHandler;

function createContent(prompt: string): string {
    const result = `
あなたはプロのソフトウェア開発者です。
以下、コミットの内容の説明です。

## コミットの内容の説明
${prompt}

上記を元に、以下の「Gitコミットメッセージ」「Gitコミットメッセージ（英語）」と「アドバイス」の部分を埋めてください。
ただし、コミットメッセージはConventional Commitsのフォーマットに従って書いてください。
また、必要に応じてGitコミットメッセージにボディとフッターを記載して構いません。

\`\`\`

## Gitコミットメッセージ
[ここに記入してください]

## Gitコミットメッセージ（英語）
[ここに記入してください]

## アドバイス
[ここに記入してください]

\`\`\`
`;

    return result;
}
