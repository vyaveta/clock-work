import { inngest } from "@/inngest/client";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai";


const google = createGoogleGenerativeAI()
const openai = createOpenAI()
const anthropic = createAnthropic()

// pages/api/inngest.ts - add to existing file
export const processTask = inngest.createFunction(
  { id: "execute-ai", triggers: { event: "execute/ai" } },
  async ({ event, step }) => {

    const { steps: geminiSteps } = await step.ai.wrap("gemini-generate-text", generateText, {
      system: "You are a helpful assistant.",
      prompt: "write a sweet greeting message for user. do not return anything else.",
      model: google("gemini-3.6-flash"),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "execute-ai",
        recordInputs: true,
        recordOutputs: true,
      },
    })
    const { steps: openaiSteps } = await step.ai.wrap("openai-generate-text", generateText, {
      system: "You are a helpful assistant.",
      prompt: "write a sweet greeting message for user. do not return anything else.",
      model: openai("gpt-4.1"),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "execute-ai",
        recordInputs: true,
        recordOutputs: true,
      },
    })
    const { steps: anthropicSteps } = await step.ai.wrap("anthropic-generate-text", generateText, {
      system: "You are a helpful assistant.",
      prompt: "write a sweet greeting message for user. do not return anything else.",
      model: anthropic("claude-sonnet-4-0"),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "execute-ai",
        recordInputs: true,
        recordOutputs: true,
      },
    })

    return {
      geminiSteps,
      openaiSteps,
      anthropicSteps
    }

  }
);