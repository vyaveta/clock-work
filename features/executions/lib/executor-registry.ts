import { NodeType } from "@/lib/generated/prisma/enums";
import { NodeExecutor } from "../types";
import { manualTriggerExecutor } from "@/features/triggers/manual-trigger/executor";
import { httpRequestExecutor } from "../components/http-request/executor";
import { googleFormTriggerExecutor } from "@/features/triggers/google-form-trigger/executor";
import { stripeTriggerExecutor } from "@/features/triggers/stripe-trigger/executor";
import { jobScraperExecutor } from "@/features/executions/components/job-scraper/executor";
import { hrEmailFinderExecutor } from "@/features/executions/components/hr-email-finder/executor";
import { schedulerTriggerExecutor } from "@/features/triggers/scheduler-trigger/executor";
import { GeminiExecutor } from "../components/gemini/executor";
import { GroqExecutor } from "../components/groq/executor";

export const executorRegistry: Record<NodeType, NodeExecutor> = {
    [NodeType.MANUAL_TRIGGER]: manualTriggerExecutor,
    [NodeType.INITIAL]: manualTriggerExecutor,
    [NodeType.HTTP_REQUEST]: httpRequestExecutor,
    [NodeType.GOOGLE_FORM_TRIGGER]: googleFormTriggerExecutor,
    [NodeType.STRIPE_TRIGGER]: stripeTriggerExecutor,
    [NodeType.JOB_SCRAPER]: jobScraperExecutor,
    [NodeType.HR_EMAIL_FINDER]: hrEmailFinderExecutor,
    [NodeType.SCHEDULE_TRIGGER]: schedulerTriggerExecutor,
    [NodeType.GEMINI]: GeminiExecutor,
    [NodeType.GROQ]: GroqExecutor,
    //@ts-ignore temp ts fix, will add real executors for below later
    [NodeType.ANTHROPIC]: GeminiExecutor,
    [NodeType.OPENAI]: GeminiExecutor,
}

export const getExecutor = (type: NodeType): NodeExecutor => {
    const executor = executorRegistry[type]

    if (!executor) {
        throw new Error(`Executor for type "${type}" not found`)
    }

    return executor
}
