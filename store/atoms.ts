import type { ReactFlowInstance } from "@xyflow/react";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const editorAtom = atom<ReactFlowInstance | null>(null) 