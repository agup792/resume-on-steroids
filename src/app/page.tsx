"use client";

import { useReducer, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { appReducer, initialState, createVariant } from "@/lib/state";
import { ChatMessage, ParsingStep } from "@/lib/types";
import { compileTypst, compileTypstWithRetry, pdfBase64ToUint8Array } from "@/lib/typst";
import LandingView from "./components/LandingView";
import ParsingView from "./components/ParsingView";
import MainLayout from "./components/MainLayout";

const SAMPLE_TYPST = `#import "@preview/basic-resume:0.2.9": *

#show: resume.with(
  author: "Jane Smith",
  location: "San Francisco, CA",
  email: "jane.smith@email.com",
  github: "github.com/janesmith",
  linkedin: "linkedin.com/in/janesmith",
  phone: "+1 (555) 123-4567",
  accent-color: "#26428b",
  font: "New Computer Modern",
  paper: "us-letter",
)

== Education

#edu(
  institution: "Stanford University",
  location: "Stanford, CA",
  dates: dates-helper(start-date: "Sep 2015", end-date: "Jun 2019"),
  degree: "Bachelor of Science, Computer Science",
)

- Dean's List all quarters
- Coursework: Machine Learning, Distributed Systems, Database Systems

== Work Experience

#work(
  title: "Senior Software Engineer",
  location: "San Francisco, CA",
  company: "TechCorp Inc.",
  dates: dates-helper(start-date: "Jul 2021", end-date: "Present"),
)

- Led migration of monolithic API to microservices architecture, reducing deployment time by 60%
- Built real-time data pipeline processing 2M+ events/day using Kafka and Apache Flink
- Mentored 4 junior engineers through structured code review and pair programming sessions

#work(
  title: "Software Engineer",
  location: "Mountain View, CA",
  company: "StartupXYZ",
  dates: dates-helper(start-date: "Aug 2019", end-date: "Jun 2021"),
)

- Developed customer-facing dashboard with React and TypeScript, serving 50K+ monthly users
- Implemented CI/CD pipeline with GitHub Actions, reducing release cycle from 2 weeks to daily
- Optimized PostgreSQL queries resulting in 40% faster page load times

== Projects

#project(
  name: "Open Source Contribution — Kubernetes",
  dates: dates-helper(start-date: "Jan 2023", end-date: "Present"),
  url: "github.com/kubernetes/kubernetes",
)

- Contributed 12 PRs to the scheduler component improving pod scheduling efficiency
- Fixed critical race condition in the controller manager affecting multi-cluster deployments

== Skills

- *Languages*: Python, Go, TypeScript, Java, SQL
- *Frameworks*: React, Next.js, FastAPI, Spring Boot
- *Infrastructure*: Kubernetes, Docker, Terraform, AWS, GCP
- *Tools*: Git, GitHub Actions, Datadog, Kafka
`;

export default function Home() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [parsingSteps, setParsingSteps] = useState<ParsingStep[]>([]);
  const [parsingFileName, setParsingFileName] = useState("");

  const activeVariant = state.variants.find((v) => v.id === state.activeVariantId);

  const handleFileSelected = useCallback(
    async (file: File) => {
      setParsingFileName(file.name);
      dispatch({ type: "SET_PARSING" });

      const steps: ParsingStep[] = [
        { label: "Resume uploaded", status: "done" },
        { label: "Extracting content...", status: "active" },
        { label: "Converting to formatted resume", status: "pending" },
        { label: "Ready", status: "pending" },
      ];
      setParsingSteps(steps);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse", {
          method: "POST",
          body: formData,
        });

        steps[1] = { label: "Content extracted", status: "done" };
        steps[2] = { label: "Converting to formatted resume...", status: "active" };
        setParsingSteps([...steps]);

        if (!res.ok) {
          throw new Error("Failed to parse resume");
        }

        const data = await res.json();

        steps[2] = { label: "Converted to formatted resume", status: "done" };
        steps[3] = { label: "Ready!", status: "active" };
        setParsingSteps([...steps]);

        await new Promise((r) => setTimeout(r, 500));

        const variant = createVariant("Original Resume", data.typstSource, "original");

        try {
          const { result, fixedSource } = await compileTypstWithRetry(data.typstSource);
          if (fixedSource) variant.typstSource = fixedSource;
          variant.compiledPdf = result.pdf;
          variant.previewImages = result.pageImages;
        } catch (compileErr) {
          console.error("Initial compilation failed:", compileErr);
        }

        const sections: string[] = data.summary?.sections || [];
        const sectionList = sections.length > 0
          ? `\n\nDetected sections: ${sections.join(", ")}.`
          : "";

        variant.chatHistory = [{
          id: uuidv4(),
          role: "assistant",
          content: `Your resume has been processed and formatted.${sectionList}\n\nI can help you edit any part — try one of the suggestions below, or ask me anything.`,
          timestamp: new Date(),
        }];

        dispatch({ type: "SET_READY", variant });
      } catch {
        const steps: ParsingStep[] = [
          { label: "Resume uploaded", status: "done" },
          { label: "Content extracted", status: "done" },
          { label: "Converted (using demo data)", status: "done" },
          { label: "Ready!", status: "done" },
        ];
        setParsingSteps(steps);
        await new Promise((r) => setTimeout(r, 800));

        const variant = createVariant("Original Resume", SAMPLE_TYPST, "original");

        try {
          const result = await compileTypst(SAMPLE_TYPST);
          variant.compiledPdf = result.pdf;
          variant.previewImages = result.pageImages;
        } catch (compileErr) {
          console.error("Sample compilation failed:", compileErr);
        }

        dispatch({ type: "SET_READY", variant });
      }
    },
    []
  );

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!activeVariant) return;

      const tailorMatch = message.match(/^\/tailor\s+(.+)/is);
      if (tailorMatch) {
        const input = tailorMatch[1].trim();
        const userMsg: ChatMessage = {
          id: uuidv4(),
          role: "user",
          content: message,
          timestamp: new Date(),
        };
        dispatch({ type: "ADD_CHAT_MESSAGE", variantId: activeVariant.id, message: userMsg });
        handleTailor(input);
        return;
      }

      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      dispatch({ type: "ADD_CHAT_MESSAGE", variantId: activeVariant.id, message: userMsg });
      setIsProcessing(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            typstSource: activeVariant.typstSource,
            chatHistory: activeVariant.chatHistory,
            userMessage: message,
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || "Chat request failed");
        }

        const data = await res.json();

        if (data.action === "edit") {
          dispatch({ type: "UPDATE_TYPST", variantId: activeVariant.id, newSource: data.typstSource });

          try {
            setIsCompiling(true);
            const { result, fixedSource } = await compileTypstWithRetry(data.typstSource);

            if (fixedSource) {
              dispatch({ type: "UPDATE_TYPST", variantId: activeVariant.id, newSource: fixedSource });
            }

            dispatch({ type: "UPDATE_PREVIEW", variantId: activeVariant.id, pdf: result.pdf, images: result.pageImages });

            const assistantMsg: ChatMessage = {
              id: uuidv4(),
              role: "assistant",
              content: "Done! I've updated your resume.",
              editSummary: data.summary,
              timestamp: new Date(),
            };
            dispatch({ type: "ADD_CHAT_MESSAGE", variantId: activeVariant.id, message: assistantMsg });
          } catch (compileErr) {
            console.error("Compile failed after retries:", compileErr);
            dispatch({ type: "UNDO", variantId: activeVariant.id });

            const errorMsg: ChatMessage = {
              id: uuidv4(),
              role: "assistant",
              content: "Couldn't apply that change — the updated resume had a formatting error. Your resume has been restored to its previous version. Try rephrasing your request.",
              timestamp: new Date(),
            };
            dispatch({ type: "ADD_CHAT_MESSAGE", variantId: activeVariant.id, message: errorMsg });
          } finally {
            setIsCompiling(false);
          }
        } else if (data.action === "clarify") {
          const assistantMsg: ChatMessage = {
            id: uuidv4(),
            role: "assistant",
            content: data.question,
            clarification: data.question,
            timestamp: new Date(),
          };
          dispatch({ type: "ADD_CHAT_MESSAGE", variantId: activeVariant.id, message: assistantMsg });
        }
      } catch (err) {
        const detail = err instanceof Error ? err.message : "";
        const errorMsg: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: detail.includes("Azure")
            ? "The AI service is temporarily unavailable. Please try again in a moment."
            : "Something went wrong. Please try again.",
          timestamp: new Date(),
        };
        dispatch({ type: "ADD_CHAT_MESSAGE", variantId: activeVariant.id, message: errorMsg });
      } finally {
        setIsProcessing(false);
      }
    },
    [activeVariant]
  );

  const handleTailor = useCallback(
    async (input: string) => {
      if (!activeVariant) return;

      setIsTailoring(true);

      const isUrl = /^https?:\/\//i.test(input) || /^www\./i.test(input);

      const progressMsg: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: isUrl
          ? "Starting tailoring process...\n\n1. Extracting job description from URL...\n2. Creating scoring rubric...\n3. Tailoring your resume...\n4. Compiling preview..."
          : "Starting tailoring process...\n\n1. Analyzing job description...\n2. Creating scoring rubric...\n3. Tailoring your resume...\n4. Compiling preview...",
        timestamp: new Date(),
      };
      dispatch({ type: "ADD_CHAT_MESSAGE", variantId: activeVariant.id, message: progressMsg });

      try {
        const body = isUrl
          ? { typstSource: activeVariant.typstSource, jdUrl: input }
          : { typstSource: activeVariant.typstSource, jdText: input };

        const res = await fetch("/api/tailor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error("Tailoring failed");

        const data = await res.json();

        if (data.error) {
          const errorMsg: ChatMessage = {
            id: uuidv4(),
            role: "assistant",
            content: data.error,
            timestamp: new Date(),
          };
          dispatch({ type: "ADD_CHAT_MESSAGE", variantId: activeVariant.id, message: errorMsg });
          return;
        }

        let finalSource = data.typstSource;

        try {
          const { result, fixedSource } = await compileTypstWithRetry(data.typstSource);
          if (fixedSource) finalSource = fixedSource;

          const newVariant = createVariant(data.variantName, finalSource, "tailored", input, data.rubric);
          newVariant.compiledPdf = result.pdf;
          newVariant.previewImages = result.pageImages;

          dispatch({ type: "ADD_VARIANT", variant: newVariant });

          const doneMsg: ChatMessage = {
            id: uuidv4(),
            role: "assistant",
            content: `Created tailored variant: "${data.variantName}". Switch to it in the left panel to review.`,
            editSummary: "New tailored variant created",
            timestamp: new Date(),
          };
          dispatch({ type: "ADD_CHAT_MESSAGE", variantId: activeVariant.id, message: doneMsg });
        } catch (compileErr) {
          console.error("Tailored variant compilation failed:", compileErr);

          const newVariant = createVariant(data.variantName, finalSource, "tailored", input, data.rubric);
          dispatch({ type: "ADD_VARIANT", variant: newVariant });

          const warnMsg: ChatMessage = {
            id: uuidv4(),
            role: "assistant",
            content: `Created tailored variant "${data.variantName}", but the preview couldn't be generated. The content is saved — try editing it to fix any formatting issues.`,
            timestamp: new Date(),
          };
          dispatch({ type: "ADD_CHAT_MESSAGE", variantId: activeVariant.id, message: warnMsg });
        }
      } catch {
        const errorMsg: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: "Failed to tailor the resume. Please check the URL and try again.",
          timestamp: new Date(),
        };
        dispatch({ type: "ADD_CHAT_MESSAGE", variantId: activeVariant.id, message: errorMsg });
      } finally {
        setIsTailoring(false);
      }
    },
    [activeVariant]
  );

  const handleDemo = useCallback(async () => {
    dispatch({ type: "SET_PARSING" });
    setParsingFileName("sample-resume.pdf");
    setParsingSteps([
      { label: "Loading sample resume...", status: "active" },
      { label: "Converting to formatted resume", status: "pending" },
      { label: "Compiling preview", status: "pending" },
      { label: "Ready", status: "pending" },
    ]);

    await new Promise((r) => setTimeout(r, 500));

    setParsingSteps([
      { label: "Sample resume loaded", status: "done" },
      { label: "Converting to formatted resume...", status: "active" },
      { label: "Compiling preview", status: "pending" },
      { label: "Ready", status: "pending" },
    ]);

    await new Promise((r) => setTimeout(r, 500));

    setParsingSteps([
      { label: "Sample resume loaded", status: "done" },
      { label: "Converted to formatted resume", status: "done" },
      { label: "Compiling preview...", status: "active" },
      { label: "Ready", status: "pending" },
    ]);

    const variant = createVariant("Original Resume", SAMPLE_TYPST, "original");

    try {
      const result = await compileTypst(SAMPLE_TYPST);
      variant.compiledPdf = result.pdf;
      variant.previewImages = result.pageImages;
    } catch (err) {
      console.error("Demo compilation failed:", err);
    }

    setParsingSteps([
      { label: "Sample resume loaded", status: "done" },
      { label: "Converted to formatted resume", status: "done" },
      { label: "Preview compiled", status: "done" },
      { label: "Ready!", status: "done" },
    ]);

    await new Promise((r) => setTimeout(r, 300));
    dispatch({ type: "SET_READY", variant });
  }, []);

  const handleDownload = useCallback(() => {
    if (!activeVariant?.compiledPdf) return;
    const pdfBytes = pdfBase64ToUint8Array(activeVariant.compiledPdf);
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeVariant.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeVariant]);

  const handleUploadNew = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  if (state.status === "landing") {
    return <LandingView onFileSelected={handleFileSelected} onDemo={handleDemo} />;
  }

  if (state.status === "parsing") {
    return <ParsingView steps={parsingSteps} fileName={parsingFileName} />;
  }

  if (!activeVariant) {
    return <LandingView onFileSelected={handleFileSelected} onDemo={handleDemo} />;
  }

  return (
    <MainLayout
      variants={state.variants}
      activeVariant={activeVariant}
      onSelectVariant={(id) => dispatch({ type: "SET_ACTIVE_VARIANT", variantId: id })}
      onDeleteVariant={(id) => dispatch({ type: "DELETE_VARIANT", variantId: id })}
      onTailor={handleTailor}
      onSendMessage={handleSendMessage}
      onUploadNew={handleUploadNew}
      onDownload={handleDownload}
      isProcessing={isProcessing}
      isTailoring={isTailoring}
      isCompiling={isCompiling}
    />
  );
}
