import re
import numpy as np
from dotenv import load_dotenv
from fastapi import APIRouter
from crewai import Crew, Agent, Task
from crewai_tools import SerperDevTool
from langchain_google_genai import ChatGoogleGenerativeAI
from sentence_transformers import SentenceTransformer
from models import AskRequest
from chat_store import store_chat
from db import chats_collection
load_dotenv()
ask_router = APIRouter()

embed_model = SentenceTransformer("all-MiniLM-L6-v2")
research_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_output_tokens=350,
)

explain_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.2,
    max_output_tokens=350,
)

fact_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_output_tokens=250,
)

guard_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_output_tokens=5,
)

search_tool = SerperDevTool()


def llm_safety_check(query: str) -> bool:
    prompt = (
        "Decide whether the following user request is SAFE or UNSAFE.\n"
        "Unsafe includes illegal activity, violence, hacking, exploitation, hate, sexual content, "
        "or actionable medical/legal advice.\n"
        "Respond with ONLY one word: SAFE or UNSAFE.\n"
        f"Request: {query}"
    )
    verdict = guard_llm.invoke(prompt).content.strip().upper()
    return verdict == "SAFE"

def cosine_sim(a, b):
    return np.dot(a,b) / (np.linalg.norm(a)*np.linalg.norm(b))

def retrieve_rag(user_id: str, query: str, k=3):
    """Find most relevant past chats"""
    q_emb = embed_model.encode(query)

    docs = list(
        chats_collection.find({
            "userId": str(user_id),
            "embedding": {"$exists": True},
            "verdict": "ALLOWED"
        })
    )

    scored = []
    for d in docs:
        score = cosine_sim(q_emb, d["embedding"])
        scored.append((score, d))

    scored.sort(reverse=True, key=lambda x: x[0])

    return [d for _, d in scored[:k]]

def is_followup(q: str) -> bool:
    q = (q or "").lower().strip()
    if len(q.split()) <= 4:
        return True
    follow_markers = [
        "elaborate", "explain more", "more details", "tell me more",
        "what do you mean", "expand", "continue",
        "why", "how so", "give example", "examples",
        "it", "that", "this", "above"
    ]
    return any(m in q for m in follow_markers)


def needs_fact_check(topic: str) -> bool:
    t = (topic or "").lower()
    risky = [
        "medical", "medicine", "diagnos", "treat", "symptom", "dose",
        "legal", "law", "contract", "lawsuit",
        "invest", "stock", "crypto", "trading",
        "politic", "election",
        "hack", "exploit", "bypass", "malware", "ddos"
    ]
    return any(k in t for k in risky)


def extract_confidence(text: str):
    if not text:
        return None

    patterns = [
        r'(\d{1,3})\s*/\s*100',
        r'(\d{1,3})\s*%',
        r'confidence\s*score\s*[:\-]?\s*(\d{1,3})',
        r'confidence\s*[:\-]?\s*(\d{1,3})',
        r'===\s*confidence\s*===\s*(\d{1,3})',
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            val = int(m.group(1))
            if 0 <= val <= 100:
                return val
    return None


def _get_task_text(task_out) -> str:
    """CrewAI versions differ; pull best available text."""
    if task_out is None:
        return ""
    if getattr(task_out, "raw", None):
        return task_out.raw
    if getattr(task_out, "output", None):
        return task_out.output
    if getattr(task_out, "json_dict", None):
        return str(task_out.json_dict)
    if getattr(task_out, "pydantic", None):
        return str(task_out.pydantic)
    return str(task_out)


def format_history(history) -> str:
    """
    history is a list of ChatTurn from AskRequest:
    [{role: "user"/"ai", content: "..."}]
    """
    if not history:
        return ""
    lines = []
    for t in history:
        role = (getattr(t, "role", "") or "").upper()
        content = (getattr(t, "content", "") or "").strip()
        if content:
            lines.append(f"{role}: {content}")
    return "\n".join(lines)


@ask_router.post("/ask")
def ask_ai(req: AskRequest):


    if not llm_safety_check(req.topic):
        store_chat(user_id=req.userId, query=req.topic, verdict="BLOCKED")
        return {
            "error": (
                "❌ I can’t help with that request. "
                "I can help with safe and legal alternatives if you want."
            )
        }

    try:
        rag_docs = retrieve_rag(req.userId, req.topic)

        rag_text = "\n\n".join([
            f"Past Q: {d['query']}\nPast A: {d['response']}"
            for d in rag_docs
        ])
        history_text = format_history(req.history)
        followup = is_followup(req.topic) and bool(history_text)
        do_fact_check = needs_fact_check(req.topic) and not followup  

        researcher = Agent(
            llm=research_llm,
            role="Research Assistant",
            goal="Find accurate information fast with sources.",
            backstory="Return only the most relevant facts with links.",
            tools=[search_tool],   
            verbose=False,
        )

        explainer = Agent(
            llm=explain_llm,
            role="Explanation Assistant",
            goal="Explain clearly and practically using conversation context.",
            backstory="Be concise and helpful. Use prior conversation when available.",
            verbose=False,
        )

        fact_checker = Agent(
            llm=fact_llm,
            role="Fact Checker",
            goal="Verify claims using ONLY provided sources and evidence.",
            backstory=(
                "You do not browse the web. You only verify claims using the sources "
                "and evidence given in the research section."
            ),
            verbose=False,
        )


        task2_followup = Task(
            description=(
                "You are continuing a conversation.\n\n"

                "=== RELEVANT PAST MEMORY ===\n"
                f"{rag_text}\n\n"

                "=== RECENT CHAT ===\n"
                f"{history_text}\n\n"

                f"User now asks: {req.topic}\n\n"

                "Rules:\n"
                "- Use memory if relevant\n"
                "- Assume pronouns refer to last AI answer\n"
                "- Expand helpfully\n"
                "- Be concise\n"
            ),
            expected_output="Context-aware follow-up answer.",
            agent=explainer,
        )


        if followup:
            crew = Crew(
                agents=[explainer],
                tasks=[task2_followup],
                respect_context_window=True,
                verbose=False,
            )

            crew_output = crew.kickoff()
            final_answer = _get_task_text(crew_output.tasks_output[0])
            confidence = None

            store_chat(
                user_id=req.userId,
                query=req.topic,
                verdict="ALLOWED",
                response=final_answer,
                confidence=confidence
            )

            return {
                "topic": req.topic,
                "answer": final_answer,
                "confidence": confidence,
                "followup_used_history": True
            }

        task1 = Task(
            description=(
                f"Research '{req.topic}' using web search.\n\n"
                "Return EXACTLY 3 items in the format below. Be concise.\n\n"
                "Format for each item:\n"
                "- Fact: <one clear factual statement, <= 18 words>\n"
                "  Evidence: <1 short paraphrased line OR a short quote <= 20 words>\n"
                "  Source: <one URL>\n\n"
                "Rules:\n"
                "- Use authoritative sources (official docs, universities, reputable orgs).\n"
                "- Evidence must clearly support the Fact.\n"
                "- Do NOT add extra sections.\n"
            ),
            expected_output="Exactly 3 fact items, each with Fact, Evidence, and Source URL.",
            agent=researcher,
        )

        task2 = Task(
            description=(
                "You are continuing an ongoing conversation.\n\n"

                "=== RELEVANT PAST USER MEMORY (RAG) ===\n"
                f"{rag_text}\n\n"

                "=== RECENT CHAT HISTORY ===\n"
                f"{history_text}\n\n"

                "Now answer the user's latest question:\n"
                f"{req.topic}\n\n"

                "Rules:\n"
                "- Use RAG memory if it is relevant\n"
                "- Otherwise ignore it\n"
                "- Prefer personalized answers using past context\n"
                "- No new facts beyond research results\n"
                "- Clear and practical explanation\n"
            ),
            expected_output="A helpful, context-aware answer.",
            agent=explainer,
        )


        tasks = [task1, task2]
        agents = [researcher, explainer]

        if do_fact_check:
            task3 = Task(
                description=(
                    "You will receive:\n"
                    "1) Research items (Fact + Evidence + Source)\n"
                    "2) An explanation written from that research\n\n"
                    "Your job:\n"
                    "- Copy the full explanation exactly as-is.\n"
                    "- Identify the TOP 3 major claims in the explanation.\n"
                    "- For each claim, decide whether it is:\n"
                    "  ✅ Supported (clearly backed by provided Evidence)\n"
                    "  ⚠️ Weak (partially supported / too vague / missing support)\n"
                    "  ❌ Not Supported (not backed by provided Evidence)\n\n"
                    "IMPORTANT RULES:\n"
                    "- Do NOT browse the web.\n"
                    "- Use ONLY the provided Evidence/Source items.\n"
                    "- If the claim needs external verification beyond the given sources, mark ⚠️ Weak.\n\n"
                    "Output EXACTLY in this format:\n"
                    "=== Explanation ===\n"
                    "<paste full explanation>\n\n"
                    "=== Fact Check ===\n"
                    "1) Claim: ...\n"
                    "   Verdict: Supported/Weak/Not Supported\n"
                    "   Evidence Used: <paste the matching Evidence line>\n"
                    "2) ...\n"
                    "3) ...\n\n"
                    "=== Confidence ===\n"
                    "<single number 0-100>\n"
                    "Reason (1 line): <why that score>\n"
                ),
                expected_output="Explanation + Fact Check (3 claims) + Confidence as a single number.",
                agent=fact_checker,
            )
            tasks.append(task3)
            agents.append(fact_checker)

        crew = Crew(
            agents=agents,
            tasks=tasks,
            respect_context_window=True,
            verbose=False,
        )

        crew_output = crew.kickoff()

        explainer_out = _get_task_text(crew_output.tasks_output[1])
        factcheck_out = _get_task_text(crew_output.tasks_output[2]) if len(crew_output.tasks_output) > 2 else ""

        final_answer = explainer_out
        confidence = extract_confidence(factcheck_out) if factcheck_out else None

        embedding = embed_model.encode(final_answer).tolist()

        store_chat(
            user_id=req.userId,
            query=req.topic,
            verdict="ALLOWED",
            response=final_answer,
            confidence=confidence,
            embedding=embedding
        )

        return {
            "topic": req.topic,
            "answer": final_answer,
            "confidence": confidence,
            "followup_used_history": False
        }

    except Exception as e:
        store_chat(user_id=req.userId, query=req.topic, verdict="ERROR")
        print("❌ ERROR:", e)
        return {"error": "Internal server error"}
