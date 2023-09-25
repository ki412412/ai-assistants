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
    // parse json 
    const json = JSON.parse(prompt);

    const result = `
あなたはプロの英会話講師です。
以下、生徒が作成した日本語（原文）と日本語（原文）の英語訳です。

## 日本語（原文）
${json.japanese}

## 日本語（原文）の英語訳
${json.english}

上記を元に、以下の「先生の英語訳(英語)」「アドバイス(日本語)」「会話の例」の部分を埋めてください。


\`\`\`
## 先生の英語訳(英語)
[ここに記入してください]

## アドバイス(日本語)
[ここに記入してください]

## 会話の例
[ここに記入してください]
\`\`\`
`;

    return result;
}
