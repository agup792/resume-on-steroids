import { AppState, ResumeVariant, ChatMessage } from "./types";
import { v4 as uuidv4 } from "uuid";

export type AppAction =
  | { type: "SET_PARSING" }
  | { type: "SET_READY"; variant: ResumeVariant }
  | { type: "SET_ACTIVE_VARIANT"; variantId: string }
  | { type: "ADD_VARIANT"; variant: ResumeVariant }
  | { type: "DELETE_VARIANT"; variantId: string }
  | { type: "UPDATE_TYPST"; variantId: string; newSource: string }
  | { type: "UPDATE_PREVIEW"; variantId: string; pdf: string; images: string[] }
  | { type: "ADD_CHAT_MESSAGE"; variantId: string; message: ChatMessage }
  | { type: "UNDO"; variantId: string }
  | { type: "RESET" };

export const initialState: AppState = {
  status: "landing",
  variants: [],
  activeVariantId: "",
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_PARSING":
      return { ...state, status: "parsing" };

    case "SET_READY":
      return {
        ...state,
        status: "ready",
        variants: [action.variant],
        activeVariantId: action.variant.id,
      };

    case "SET_ACTIVE_VARIANT":
      return { ...state, activeVariantId: action.variantId };

    case "ADD_VARIANT":
      return {
        ...state,
        variants: [...state.variants, action.variant],
        activeVariantId: action.variant.id,
      };

    case "DELETE_VARIANT": {
      const remaining = state.variants.filter((v) => v.id !== action.variantId);
      return {
        ...state,
        variants: remaining,
        activeVariantId:
          state.activeVariantId === action.variantId
            ? remaining[0]?.id || ""
            : state.activeVariantId,
      };
    }

    case "UPDATE_TYPST":
      return {
        ...state,
        variants: state.variants.map((v) =>
          v.id === action.variantId
            ? {
                ...v,
                typstHistory: [...v.typstHistory, v.typstSource],
                typstSource: action.newSource,
              }
            : v
        ),
      };

    case "UPDATE_PREVIEW":
      return {
        ...state,
        variants: state.variants.map((v) =>
          v.id === action.variantId
            ? { ...v, compiledPdf: action.pdf, previewImages: action.images }
            : v
        ),
      };

    case "ADD_CHAT_MESSAGE":
      return {
        ...state,
        variants: state.variants.map((v) =>
          v.id === action.variantId
            ? { ...v, chatHistory: [...v.chatHistory, action.message] }
            : v
        ),
      };

    case "UNDO": {
      return {
        ...state,
        variants: state.variants.map((v) => {
          if (v.id !== action.variantId || v.typstHistory.length === 0) return v;
          const previous = v.typstHistory[v.typstHistory.length - 1];
          return {
            ...v,
            typstSource: previous,
            typstHistory: v.typstHistory.slice(0, -1),
          };
        }),
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function createVariant(
  name: string,
  typstSource: string,
  type: "original" | "tailored",
  jdUrl?: string,
  rubric?: string
): ResumeVariant {
  return {
    id: uuidv4(),
    name,
    typstSource,
    typstHistory: [],
    compiledPdf: null,
    previewImages: [],
    chatHistory: [],
    metadata: {
      type,
      sourceJdUrl: jdUrl,
      rubric,
      createdAt: new Date(),
    },
  };
}
